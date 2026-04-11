import nodemailer from 'nodemailer';
import type { Appointment } from '@/lib/types';

function createTransporter() {
    if (!process.env.SMTP_HOST) return null;
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function sendBookingConfirmation(
    appointment: Appointment,
    firstName: string,
    lastName: string,
    patientEmail: string
) {
    const transporter = createTransporter();
    if (!transporter) {
        console.log('[email] SMTP not configured – skipping booking confirmation');
        return;
    }
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: patientEmail,
            subject: `Appointment Confirmation – ${process.env.SMTP_FROM_NAME}`,
            html: `
                <p>Dear ${firstName} ${lastName},</p>
                <p>Your appointment has been confirmed. Here are the details:</p>
                <ul>
                    <li><strong>Type:</strong> ${capitalize(appointment.appointment_type)}</li>
                    <li><strong>Date &amp; Time:</strong> ${formatDateTime(appointment.start_time)}</li>
                    <li><strong>End Time:</strong> ${formatDateTime(appointment.end_time)}</li>
                </ul>
                <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
                <p>Thank you,<br/>${process.env.SMTP_FROM_NAME}</p>
            `,
        });
    } catch (err) {
        console.error('[email] Failed to send booking confirmation:', err);
    }
}

export async function sendReschedulingNotification(
    appointment: Appointment,
    firstName: string,
    lastName: string,
    patientEmail: string
) {
    const transporter = createTransporter();
    if (!transporter) {
        console.log('[email] SMTP not configured – skipping rescheduling notification');
        return;
    }
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: patientEmail,
            subject: 'Appointment Rescheduled – SmylSync Dental',
            html: `
                <p>Dear ${firstName} ${lastName},</p>
                <p>Your appointment has been rescheduled. Here are your updated details:</p>
                <ul>
                    <li><strong>Type:</strong> ${capitalize(appointment.appointment_type)}</li>
                    <li><strong>New Date &amp; Time:</strong> ${formatDateTime(appointment.start_time)}</li>
                    <li><strong>New End Time:</strong> ${formatDateTime(appointment.end_time)}</li>
                </ul>
                <p>If this does not look correct, please contact us immediately.</p>
                <p>Thank you,<br/>SmylSync Dental</p>
            `,
        });
    } catch (err) {
        console.error('[email] Failed to send rescheduling notification:', err);
    }
}

export async function sendCancellationNotice(
    appointment: Appointment,
    firstName: string,
    lastName: string,
    patientEmail: string
) {
    const transporter = createTransporter();
    if (!transporter) {
        console.log('[email] SMTP not configured – skipping cancellation notice');
        return;
    }
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: patientEmail,
            subject: 'Appointment Cancellation – SmylSync Dental',
            html: `
                <p>Dear ${firstName} ${lastName},</p>
                <p>Your appointment has been cancelled. Details of the cancelled appointment:</p>
                <ul>
                    <li><strong>Type:</strong> ${capitalize(appointment.appointment_type)}</li>
                    <li><strong>Original Date &amp; Time:</strong> ${formatDateTime(appointment.start_time)}</li>
                </ul>
                <p>Please contact us to reschedule at your earliest convenience.</p>
                <p>Thank you,<br/>SmylSync Dental</p>
            `,
        });
    } catch (err) {
        console.error('[email] Failed to send cancellation notice:', err);
    }
}

export async function sendReminderEmail(
    appointment: Appointment,
    firstName: string,
    lastName: string,
    patientEmail: string
) {
    const transporter = createTransporter();
    if (!transporter) {
        console.log('[email] SMTP not configured – skipping reminder email');
        return;
    }
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: patientEmail,
            subject: 'Appointment Reminder – SmylSync Dental',
            html: `
                <p>Dear ${firstName} ${lastName},</p>
                <p>This is a friendly reminder that you have an appointment scheduled for <strong>tomorrow</strong>:</p>
                <ul>
                    <li><strong>Type:</strong> ${capitalize(appointment.appointment_type)}</li>
                    <li><strong>Date &amp; Time:</strong> ${formatDateTime(appointment.start_time)}</li>
                    <li><strong>End Time:</strong> ${formatDateTime(appointment.end_time)}</li>
                </ul>
                <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
                <p>We look forward to seeing you!</p>
                <p>Thank you,<br/>SmylSync Dental</p>
            `,
        });
    } catch (err) {
        console.error('[email] Failed to send reminder email:', err);
    }
}
