from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

from tracker.emails import send_weekly_summary
from tracker.models import EmailNotificationPreference


class Command(BaseCommand):
    help = 'Send weekly expense summary emails to users who have opted in'

    def handle(self, *args, **options):
        # Get users who have weekly_summary enabled
        opted_in = EmailNotificationPreference.objects.filter(
            weekly_summary=True
        ).values_list('user_id', flat=True)

        users = User.objects.filter(id__in=opted_in, is_active=True)
        sent = 0

        for user in users:
            send_weekly_summary(user)
            sent += 1

        self.stdout.write(self.style.SUCCESS(
            f'Sent weekly summary to {sent} user(s).'
        ))
