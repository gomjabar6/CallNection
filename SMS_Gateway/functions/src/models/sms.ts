export interface SMSReceipt {
    data: SMSData
}

export interface SMSData {
    attributes: SMSAttributes,
    id: string,
    type: "message"
}

export interface SMSAttributes {
    amount_display: string,
    amount_nanodollars: string,
    body: string,
    direction: "inbound",
    from: string,
    is_mms: false,
    message_callback_url: string,
    message_encoding: number,
    status: string,
    timestamp: Date,
    to: string,
}