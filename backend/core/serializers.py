from os import read
from time import timezone
from rest_framework import serializers
from .models import Student, Class, ClassOption, PricePlan, Enrollment, Payment

class StudentSerializer(serializers.ModelSerializer):
    enrolled_classes = serializers.StringRelatedField(read_only=True, many=True)
    is_paid = serializers.BooleanField(source='enrollments.filter(paid_on__isnull=False).exists', read_only=True)
    is_late = serializers.BooleanField(source='enrollments.filter(due_date__lt=timezone.now()).exists', read_only=True)
    amount_due = serializers.IntegerField(source='enrollments.aggregate(Sum("amount_due"))', read_only=True)
    debt = serializers.IntegerField(source='enrollments.aggregate(Sum("amount_due")) - enrollments.aggregate(Sum("amount_paid"))', read_only=True)
    has_family = serializers.BooleanField(source='is_family_member', read_only=True)
    
    class Meta:
        model = Student
        fields = ['id', 'DNI', 'first_name', 'last_name', 'birth_date', 'active', 'is_family_member', 
                  'created_at', 'enrolled_classes', 'is_paid', 'is_late', 'amount_due', 'debt', 'has_family']
        
class ClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = Class
        fields = ['id', 'name']
        
class ClassOptionSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='klass.name', read_only=True)
    monthly_price = serializers.IntegerField(source='priceplan_set.filter(cycle="M").first.base_price', read_only=True)
    biannual_price = serializers.IntegerField(source='priceplan_set.filter(cycle="S").first.base_price', read_only=True)
    
    class Meta:
        model = ClassOption
        fields = ['id', 'klass', 'weekly_sessions', 'class_name', 'monthly_price', 'biannual_price']
        
    def _price(self, obj, cycle):
        try: 
            return obj.priceplan_set.get(cycle=cycle).base_price
        except PricePlan.DoesNotExist:
            return None
        
    def get_monthly_price(self, obj):
        return self._price(obj, 'M')

    def get_biannual_price(self, obj):
        return self._price(obj, 'S')
    
class EnrollmentSerializer(serializers.ModelSerializer):
    student_dni = serializers.CharField(source='student.DNI', read_only=True)
    course_name = serializers.CharField(source='class_option.klass.name', read_only=True)
    weekly_sessions = serializers.IntegerField(source='class_option.weekly_sessions', read_only=True)
    
    set_student_dni = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'set_student_dni', 'student_dni', 'class_option', 'course_name', 'weekly_sessions',
                  'enrollment_date', 'due_date', 'paid_on', 'amount_due', 'amount_paid']
        read_only_fields = ['student_dni', 'course_name', 'weekly_sessions']
        
    def validate(self, attrs):
        dni = attrs.get('set_student_dni', None)
        if dni and "student" not in attrs:
            try:
                attrs['student'] = Student.objects.get(DNI=dni)
            except Student.DoesNotExist:
                raise serializers.ValidationError({"set_student_dni": "Student with this DNI does not exist."})
        return super().validate(attrs)
    
class PaymentSerializer(serializers.ModelSerializer):
    student_dni = serializers.CharField(source='enrollment.student.DNI', read_only=True)
    class_name = serializers.CharField(source='enrollment.class_option.klass.name', read_only=True)
    is_paid = serializers.SerializerMethodField()
    is_late = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = ['id', 'enrollment', 'student_dni', 'class_name', 'due_date', 'paid_on', 'amount_due', 'amount_paid', 
                  'is_paid', 'is_late']
        read_only_fields = ['student_dni', 'class_name']
        
    def get_is_paid(self, obj) -> bool:
        return obj.amount_paid is not None and obj.amount_paid >= obj.amount_due
    
    def get_is_late(self, obj) -> bool:
        return not self.get_is_paid(obj) and obj.due_date < timezone.now().date()