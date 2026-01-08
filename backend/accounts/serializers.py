from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "university", "plan", "quota_mb", "created_at"]
        read_only_fields = ["id", "email", "plan", "quota_mb", "created_at"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "password", "plan", "quota_mb"]
        read_only_fields = ["plan", "quota_mb"]

    def validate_email(self, value):
        """Check if email already exists and provide a user-friendly error"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists. Please sign in instead.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class AccountDeleteSerializer(serializers.Serializer):
    deletion_reasons = serializers.DictField(
        child=serializers.BooleanField(),
        required=False,
        allow_empty=True,
        help_text="Optional checkboxes for deletion reasons"
    )
    
    # No password required - email verification will be used instead


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class EmailVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)