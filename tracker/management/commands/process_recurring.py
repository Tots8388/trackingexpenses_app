from django.core.management.base import BaseCommand
from django.utils import timezone

from tracker.models import RecurringTransaction, Transaction


class Command(BaseCommand):
    help = 'Process recurring transactions whose next_run date has arrived'

    def handle(self, *args, **options):
        today = timezone.now().date()
        due = RecurringTransaction.objects.filter(is_active=True, next_run__lte=today)

        created = 0
        for rec in due:
            # Create the actual transaction
            Transaction.objects.create(
                user=rec.user,
                amount=rec.amount,
                category=rec.category,
                type=rec.type,
                date=rec.next_run,
                description=f'{rec.description} (recurring)',
            )
            created += 1

            # Advance to next occurrence
            rec.advance_next_run()

        self.stdout.write(self.style.SUCCESS(
            f'Processed {created} recurring transaction(s) due on or before {today}.'
        ))
