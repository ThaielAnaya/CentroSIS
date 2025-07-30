# core/serializers.py
from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers
from .models import CUTOFF_DAY

from .models import (
    Student,
    Class,
    ClassOption,
    PricePlan,
    Enrollment,
    Payment,
)


# ─── STUDENT ──────────────────────────────────────────────────────────────────

class StudentSerializer(serializers.ModelSerializer):
    # values are supplied by the annotated queryset in student_with_finance()
    enrolled_classes = serializers.ListField(
        child=serializers.CharField(),
        read_only=True,
    )
    enrolled_count = serializers.IntegerField(read_only=True)
    amount_due       = serializers.IntegerField(read_only=True)
    debt             = serializers.IntegerField(read_only=True)
    is_paid          = serializers.BooleanField(read_only=True)
    is_late          = serializers.BooleanField(read_only=True)
    display_cuil = serializers.CharField(read_only=True)
    has_family       = serializers.BooleanField(source='is_family_member', read_only=True)

    class Meta:
        model  = Student
        fields = [
            'id', 'DNI', 'display_cuil', 'first_name', 'last_name', 'birth_date', 'contact', 'active',
            'is_family_member', 'created_at',
            'enrolled_classes', 'enrolled_count', 'is_paid', 'is_late', 'amount_due', 'debt',
            'has_family', 'credit_balance' 
        ]


# ─── CLASS ────────────────────────────────────────────────────────────────────

class ClassSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Class
        fields = ['id', 'name']


# ─── CLASS OPTION ─────────────────────────────────────────────────────────────

class ClassOptionSerializer(serializers.ModelSerializer):
    class_name      = serializers.CharField(source='klass.name', read_only=True)
    monthly_price   = serializers.IntegerField(
        source='priceplan_set.filter(cycle="M").first.base_price', read_only=True
    )
    biannual_price  = serializers.IntegerField(
        source='priceplan_set.filter(cycle="S").first.base_price', read_only=True
    )

    class Meta:
        model  = ClassOption
        fields = [
            'id', 'klass', 'weekly_sessions',
            'class_name', 'monthly_price', 'biannual_price',
        ]


# ─── ENROLLMENT ───────────────────────────────────────────────────────────────

class EnrollmentSerializer(serializers.ModelSerializer):
    student_dni     = serializers.CharField(source='student.DNI', read_only=True)
    course_name     = serializers.CharField(source='option.klass.name', read_only=True)
    weekly_sessions = serializers.IntegerField(source='option.weekly_sessions', read_only=True)

    # helper to attach a student by DNI on create
    set_student_dni = serializers.CharField(write_only=True, required=False)

    class Meta:
        model  = Enrollment
        fields = [
            'id', 'student', 'set_student_dni', 'student_dni',
            'option', 'course_name', 'weekly_sessions',
            'start',
        ]
        read_only_fields = ['student_dni', 'course_name', 'weekly_sessions']

    def validate(self, attrs):
        dni = attrs.pop('set_student_dni', None)
        if dni and 'student' not in attrs:
            try:
                attrs['student'] = Student.objects.get(DNI=dni)
            except Student.DoesNotExist:
                raise serializers.ValidationError(
                    {'set_student_dni': 'Student with this DNI does not exist.'}
                )
        return super().validate(attrs)


class EnrollmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Enrollment
        fields = ('option', 'start')


# ─── PAYMENT ──────────────────────────────────────────────────────────────────

class PaymentSerializer(serializers.ModelSerializer):
    student_dni = serializers.CharField(source='enrollment.student.DNI', read_only=True)
    class_name  = serializers.CharField(source='enrollment.option.klass.name', read_only=True)
    is_paid     = serializers.SerializerMethodField()
    is_late     = serializers.SerializerMethodField()

    class Meta:
        model  = Payment
        fields = [
            'id', 'enrollment', 'student_dni', 'class_name',
            'due_date', 'paid_on', 'amount_due', 'amount_paid',
            'is_paid', 'is_late',
        ]
        read_only_fields = ['student_dni', 'class_name']

    def get_is_paid(self, obj) -> bool:
        return obj.amount_paid is not None and obj.amount_paid >= obj.amount_due

    def get_is_late(self, obj) -> bool:
        if self.get_is_paid(obj):
            return False
        joined_before = obj.enrollment.start.day <= CUTOFF_DAY
        after_cutoff  = timezone.now().date().day > CUTOFF_DAY
        return joined_before and after_cutoff

class PaymentListSerializer(serializers.ModelSerializer):
    DNI        = serializers.CharField(source='enrollment.student.DNI')
    last_name  = serializers.CharField(source='enrollment.student.last_name')
    first_name = serializers.CharField(source='enrollment.student.first_name')
    class_name = serializers.CharField(source='enrollment.option.klass.name')
    cuil = serializers.CharField(source='enrollment.student.cuil')

    class Meta:
        model  = Payment
        fields = [
            'DNI', 'cuil', 'last_name', 'first_name',
            'class_name', 'cycle', 'amount_paid',
            'method', 'paid_on',
        ]

# ─── STUDENT CREATE ──────────────────────────────────────────────────────────

class StudentCreateSerializer(serializers.ModelSerializer):
    enrollments = EnrollmentCreateSerializer(many=True, write_only=True)

    class Meta:
        model  = Student
        fields = [
            'DNI', 'first_name', 'last_name', 'birth_date',
            'is_family_member', 'enrollments', 'cuil', 'contact',
        ]

    def create(self, validated_data):
        enrollments_data = validated_data.pop('enrollments', [])
        student = Student.objects.create(**validated_data)
        for payload in enrollments_data:
            Enrollment.objects.create(student=student, **payload)
        return student

    def to_representation(self, instance):
        return StudentSerializer(instance).data
