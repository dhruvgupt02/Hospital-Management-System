from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.accounts.models import UserRole

User = get_user_model()

class Command(BaseCommand):
    help = 'Safely creates a development administrator account.'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, default='admin@medicare.local', help='Admin email address')
        parser.add_argument('--password', type=str, default='AdminPass123!', help='Admin password')
        parser.add_argument('--first-name', type=str, default='System', help='Admin first name')
        parser.add_argument('--last-name', type=str, default='Administrator', help='Admin last name')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        first_name = options['first_name']
        last_name = options['last_name']

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': first_name,
                'last_name': last_name,
                'role': UserRole.ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )

        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Successfully created administrator: {email}"))
        else:
            user.role = UserRole.ADMIN
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.WARNING(f"Administrator account {email} already exists; updated credentials and roles."))
