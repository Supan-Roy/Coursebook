import logging
from typing import Iterable, List

import requests
from django.conf import settings


logger = logging.getLogger(__name__)


def _get_resend_api_key() -> str:
    """
    Get the Resend API key.

    Priority:
    1. Explicit RESEND_API_KEY setting
    2. EMAIL_HOST_PASSWORD (works if you're already using Resend SMTP)
    """
    api_key = getattr(settings, "RESEND_API_KEY", "") or getattr(
        settings, "EMAIL_HOST_PASSWORD", ""
    )
    return api_key


def send_email_via_resend(
    subject: str,
    message: str,
    to_emails: Iterable[str],
    html_message: str = None,
) -> None:
    """
    Send email using Resend HTTP API instead of SMTP.

    This is mainly for production environments (e.g. Railway) where
    outbound SMTP might be blocked or unreliable.
    
    Args:
        subject: Email subject
        message: Plain text email message
        to_emails: List of recipient email addresses
        html_message: Optional HTML version of the email
    """
    api_key = _get_resend_api_key()
    if not api_key:
        raise RuntimeError("RESEND_API_KEY/EMAIL_HOST_PASSWORD is not configured")

    if isinstance(to_emails, str):
        to_list: List[str] = [to_emails]
    else:
        to_list = list(to_emails)

    if not to_list:
        return

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", None)
    if not from_email:
        raise RuntimeError("DEFAULT_FROM_EMAIL is not configured")

    email_data = {
        "from": from_email,
        "to": to_list,
        "subject": subject,
        "text": message,
    }
    
    # Add HTML version if provided
    if html_message:
        email_data["html"] = html_message

    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=email_data,
            timeout=10,
        )
        response.raise_for_status()
    except Exception as exc:  # pragma: no cover - just logging
        logger.error("Failed to send email via Resend: %s", exc, exc_info=True)
        # Re-raise so caller can handle/log appropriately
        raise


