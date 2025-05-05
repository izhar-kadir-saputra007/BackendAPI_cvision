import midtransClient from "midtrans-client";
import UserModel from "../../../models/userModel.js";
import TransaksiModel from "../../../models/transaksiModel.js";
import { 
  sendConfirmationEmail,
  sendFailedPaymentEmail,
  sendRefundNotification,
  sendFraudReviewNotification 
} from "../../../utils/emailPayments.js";
import dotenv from "dotenv";
import db from "../../../config/dataBase.js"
import { Op } from "sequelize";
dotenv.config();

// Configure Midtrans
const snap = new midtransClient.Snap({
  isProduction: process.env.NODE_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

export const createPayment = async (req, res) => {
  const t = await db.transaction();
  try {
    // 1. Get frontend URL configuration
    const frontendUrl = process.env.FRONTEND_URL || "https://381b-36-90-138-202.ngrok-free.app";
    if (!frontendUrl.includes('http')) {
      throw {
        code: "URL_INVALID",
        message: "Invalid FRONTEND_URL in environment variables"
      };
    }

    // 2. Get user data
    const { id: userId, name, email, phoneNumber } = req.user;
    if (!email) {
      throw {
        code: "USER_DATA_INCOMPLETE",
        message: "User email is required"
      };
    }

    // 3. Validate input
    const { amount = 50000, productName = "Premium Membership" } = req.body;
    if (!Number.isInteger(amount) || amount < 10000) {
      throw {
        code: "INVALID_AMOUNT",
        message: "Payment amount must be at least Rp 10,000 and an integer"
      };
    }

    // 4. Create order ID
    const orderId = `ORDER-${userId}-${Date.now()}`;
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ') || '';

    // 5. Prepare Midtrans transaction data
    const transactionData = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      item_details: [{
        id: "PREMIUM_001",
        price: amount,
        quantity: 1,
        name: productName,
        brand: "YourBrand",
        category: "Subscription"
      }],
      customer_details: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phoneNumber || '',
        user_id: userId.toString()
      },
      callbacks: {
        finish: `${frontendUrl}/payment-callback/success`,
        error: `${frontendUrl}/payment-callback/failure`,
        pending: `${frontendUrl}/payment-callback/pending`
      },
      metadata: {
        created_by: "system",
        device: req.headers['user-agent'],
        ip_address: req.ip
      },
      credit_card: {
        secure: true
      }
    };

    // 6. Create Midtrans transaction
    const midtransResponse = await snap.createTransaction(transactionData);
    if (!midtransResponse.token || !midtransResponse.redirect_url) {
      throw {
        code: "MIDTRANS_ERROR",
        message: "Failed to create payment transaction"
      };
    }

    // Log PDF URL for debugging
    console.log("Midtrans PDF URL during creation:", {
      orderId,
      pdf_url: midtransResponse.pdf_url
    });

    // 7. Save to database
    // FIXED: Ensure pdfUrl is explicitly set from midtransResponse.pdf_url
    await TransaksiModel.create({
      userId,
      orderId,
      grossAmount: amount,
      transactionStatus: "pending",
      paymentType: null,
      fraudStatus: null,
      pdfUrl: midtransResponse.pdf_url || null, // Explicitly store PDF URL
      metadata: {
        midtrans_token: midtransResponse.token,
        product: productName,
        ip_address: req.ip,
        pdf_url: midtransResponse.pdf_url || null, // Duplicate in metadata for safety
        request_data: {
          headers: {
            'user-agent': req.headers['user-agent']
          }
        }
      }
    }, { transaction: t });

    await t.commit();

    // 8. Return success response
    res.status(201).json({
      success: true,
      data: {
        token: midtransResponse.token,
        order_id: orderId,
        redirect_url: midtransResponse.redirect_url,
        pdf_url: midtransResponse.pdf_url,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        metadata: {
          payment_methods: "bank_transfer/credit_card"
        }
      }
    });

  } catch (error) {
    await t.rollback();
    
    console.error("Payment creation error:", {
      error: error.message,
      userId: req.user?.id,
      endpoint: req.originalUrl,
      timestamp: new Date().toISOString()
    });

    const statusCode = error.code === "URL_INVALID" || error.code === "INVALID_AMOUNT" ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.code || "PAYMENT_ERROR",
      message: error.message || "Failed to process payment",
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

export const handlePaymentNotification = async (req, res) => {
  // Log incoming notification
  console.log("Midtrans Notification:", {
    orderId: req.body?.order_id,
    status: req.body?.transaction_status,
    pdf_url: req.body?.pdf_url, // Log PDF URL from notification
    timestamp: new Date().toISOString()
  });

  if (req.method === 'OPTIONS' || !req.body || Object.keys(req.body).length === 0) {
    return res.status(200).send("OK");
  }

  const t = await db.transaction();
  try {
    const {
      order_id,
      transaction_status,
      payment_type,
      fraud_status,
      settlement_time,
      gross_amount,
      va_numbers,
      pdf_url,
      currency
    } = req.body;

    // Validate required fields
    if (!order_id || !transaction_status) {
      console.error("Invalid notification payload");
      return res.status(400).json({ 
        status: "error", 
        message: "Missing required fields" 
      });
    }

    // Find transaction with user data
    const transaction = await TransaksiModel.findOne({
      where: { orderId: order_id },
      include: [{
        model: UserModel,
        as: 'user',
        attributes: ['id', 'email', 'name', 'isPremium']
      }],
      transaction: t,
      lock: true
    });

    if (!transaction) {
      console.error(`Transaction ${order_id} not found`);
      return res.status(404).json({ 
        status: "error", 
        message: "Transaction not found" 
      });
    }

    // Debug current PDF URL values
    console.log("PDF URL before update:", {
      orderId: order_id,
      currentPdfUrl: transaction.pdfUrl,
      currentMetadataPdfUrl: transaction.metadata?.pdf_url,
      notificationPdfUrl: pdf_url
    });

    // FIXED: Prioritize new PDF URL if available, otherwise keep existing
    const updatedPdfUrl = pdf_url || transaction.pdfUrl || transaction.metadata?.pdf_url || null;

    // Prepare update data
    const updateData = {
      transactionStatus: transaction_status.toLowerCase(),
      paymentType: payment_type,
      fraudStatus: fraud_status,
      settlementTime: settlement_time ? new Date(settlement_time) : null,
      vaNumber: va_numbers?.[0]?.va_number || null,
      bank: va_numbers?.[0]?.bank || null,
      // FIXED: Ensure pdfUrl is properly set
      pdfUrl: updatedPdfUrl,
      metadata: {
        ...transaction.metadata,
        // FIXED: Update metadata.pdf_url as well
        pdf_url: updatedPdfUrl,
        currency: currency || 'IDR',
        lastNotification: {
          receivedAt: new Date(),
          payload: req.body
        }
      }
    };

    // Debug update data
    console.log("PDF URL update data:", {
      orderId: order_id,
      updatedPdfUrl,
      updateDataPdfUrl: updateData.pdfUrl,
      updateDataMetadataPdfUrl: updateData.metadata.pdf_url
    });

    // Update transaction
    await transaction.update(updateData, { transaction: t });

    // Handle status changes if user data exists
    if (transaction.user && transaction.user.email) {
      await handleStatusChange(transaction, req.body, t);
    } else {
      console.error("Cannot process status change - missing user data:", {
        orderId: transaction.orderId,
        userId: transaction.userId,
        hasEmail: !!transaction.user?.email
      });
    }

    await t.commit();
    return res.status(200).send("OK");

  } catch (error) {
    await t.rollback();
    console.error("Notification processing error:", {
      error: error.message,
      orderId: req.body?.order_id,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    return res.status(200).send("OK"); // Always return 200 to Midtrans
  }
};

const handleStatusChange = async (transaction, payload, t) => {
  const { transaction_status, fraud_status, status_message, pdf_url } = payload;
  const user = transaction.user;

  try {
    // FIXED: If pdf_url is present in the payload, update it in the transaction
    if (pdf_url && !transaction.pdfUrl) {
      await transaction.update({ 
        pdfUrl: pdf_url,
        metadata: {
          ...transaction.metadata,
          pdf_url: pdf_url
        }
      }, { transaction: t });
    }

    switch (transaction_status.toLowerCase()) {
      case 'capture':
      case 'settlement':
        if (fraud_status === 'accept') {
          await user.update({ isPremium: true }, { transaction: t });
          await sendConfirmationEmail(user.email, {
            orderId: transaction.orderId,
            amount: transaction.grossAmount,
            paymentMethod: transaction.paymentType,
            vaNumber: transaction.vaNumber,
            bank: transaction.bank,
            transactionTime: transaction.transactionTime,
            // FIXED: Include the PDF URL in the email
            pdfUrl: transaction.pdfUrl || pdf_url || transaction.metadata?.pdf_url
          });
        } else if (fraud_status === 'challenge') {
          await sendFraudReviewNotification(user.email, {
            orderId: transaction.orderId,
            amount: transaction.grossAmount,
            paymentMethod: transaction.paymentType
          });
        }
        break;

      case 'deny':
      case 'cancel':
      case 'expire':
      case 'failure':
        await sendFailedPaymentEmail(user.email, {
          orderId: transaction.orderId,
          reason: status_message || 'Unknown',
          status: transaction_status,
          paymentMethod: transaction.paymentType,
          amount: transaction.grossAmount
        });
        break;

      case 'refund':
      case 'partial_refund':
        await handleRefund(transaction, payload, t);
        break;

      default:
        console.log(`Unprocessed status: ${transaction_status}`);
    }
  } catch (error) {
    console.error("Status change handler error:", {
      error: error.message,
      orderId: transaction.orderId,
      userId: user.id
    });
    // Don't throw to prevent breaking the notification flow
  }
};

const handleRefund = async (transaction, payload, t) => {
  const user = transaction.user;
  
  try {
    await user.update({ isPremium: false }, { transaction: t });
    
    await sendRefundNotification(user.email, {
      orderId: transaction.orderId,
      amount: payload.gross_amount,
      refundAmount: payload.refund_amount || payload.gross_amount,
      reason: payload.status_message || 'Refund processed',
      originalPaymentDate: transaction.transactionTime,
      refundDate: new Date()
    });
  } catch (error) {
    console.error("Refund processing error:", {
      error: error.message,
      orderId: transaction.orderId
    });
  }
};

export const getTransactionStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Cari transaksi dengan relasi user termasuk data lengkap user
    const transaction = await TransaksiModel.findOne({
      where: { orderId },
      include: [{
        model: UserModel,
        as: 'user',
        attributes: ['id', 'email', 'name', 'phoneNumber', 'isPremium'] // Tambahkan field yang diperlukan
      }]
    });

    if (!transaction) {
      console.log(`Transaksi tidak ditemukan: ${orderId}`);
      return res.status(404).json({
        success: false,
        message: "Transaksi tidak ditemukan",
        errorCode: "TRANSACTION_NOT_FOUND"
      });
    }

    // Verifikasi kepemilikan transaksi
    if (transaction.userId !== userId) {
      console.log(`Akses tidak diizinkan: User ${userId} mencoba akses transaksi ${transaction.userId}`);
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses ke transaksi ini",
        errorCode: "UNAUTHORIZED"
      });
    }

    // Format data response dengan informasi user
    const responseData = {
      order_id: transaction.orderId,
      transaction_status: transaction.transactionStatus,
      payment_type: transaction.paymentType,
      gross_amount: transaction.grossAmount,
      va_numbers: transaction.vaNumber ? [{
        bank: transaction.bank,
        va_number: transaction.vaNumber
      }] : null,
      settlement_time: transaction.settlementTime,
      user_details: {  // Tambahkan data user
        email: transaction.user?.email,
        name: transaction.user?.name,
        phone_number: transaction.user?.phoneNumber,
        is_premium: transaction.user?.isPremium || false
      }
    };

    console.log(`Berhasil mengambil data transaksi: ${orderId}`);
    return res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error("Error saat mengambil status transaksi:", {
      error: error.message,
      stack: error.stack,
      orderId: req.params?.orderId,
      userId: req.user?.id
    });
    
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
      errorCode: "SERVER_ERROR"
    });
  }
};

export const checkPaymentStatus = async (req, res) => {
  try {
    const { order_id } = req.params;

    if (!order_id) {
      return res.status(400).json({
        success: false,
        error: "MISSING_ORDER_ID",
        message: "Order ID is required"
      });
    }

    // Check database first
    const transaction = await TransaksiModel.findOne({
      where: { orderId: order_id },
      include: [{
        model: UserModel,
        attributes: ['id', 'email', 'isPremium']
      }]
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: "TRANSACTION_NOT_FOUND",
        message: "Transaction not found"
      });
    }

    // If pending, verify with Midtrans
    if (transaction.transactionStatus === 'pending') {
      try {
        const midtransStatus = await snap.transaction.status(order_id);
        
        if (midtransStatus.transaction_status !== transaction.transactionStatus) {
          await transaction.update({
            transactionStatus: midtransStatus.transaction_status,
            paymentType: midtransStatus.payment_type,
            fraudStatus: midtransStatus.fraud_status,
            statusMessage: midtransStatus.status_message,
            settlementTime: midtransStatus.settlement_time || null
          });

          // Trigger status change handling if needed
          if (['capture', 'settlement', 'deny', 'cancel'].includes(midtransStatus.transaction_status)) {
            await handleStatusChange(transaction, midtransStatus);
          }
        }
      } catch (midtransError) {
        console.error("Midtrans status check error:", midtransError);
        // Continue with database status
      }
    }

    // Format response
    const response = {
      success: true,
      data: {
        orderId: transaction.orderId,
        status: transaction.transactionStatus,
        paymentMethod: transaction.paymentType,
        amount: transaction.grossAmount,
        transactionTime: transaction.transactionTime,
        settlementTime: transaction.settlementTime,
        isSettled: ['capture', 'settlement'].includes(transaction.transactionStatus),
        user: {
          isPremium: transaction.user?.isPremium || false
        },
        fraudStatus: transaction.fraudStatus,
        statusMessage: transaction.statusMessage
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("Status check error:", error);
    
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to check payment status",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const { userId } = req.user;
    const { status, limit = 10, page = 1 } = req.query;

    const whereClause = { userId };
    if (status) whereClause.transactionStatus = status;

    const { count, rows } = await TransaksiModel.findAndCountAll({
      where: whereClause,
      order: [['transactionTime', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      include: [{
        model: UserModel,
        attributes: ['name', 'email']
      }]
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalItems: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error("Payment history error:", error);
    
    res.status(500).json({
      success: false,
      error: "HISTORY_FETCH_FAILED",
      message: "Failed to fetch payment history"
    });
  }
};