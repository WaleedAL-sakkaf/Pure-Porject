import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { editUser } from '../../services/authService';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSuccess: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: user.username || '',
    companyName: user.companyName || '',
    phoneNumbers: user.phoneNumbers || [''],
    role: user.role || UserRole.PosAgent
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Filter out empty phone numbers
      const phoneNumbers = formData.phoneNumbers.filter(phone => phone.trim() !== '');
      
      if (phoneNumbers.length === 0) {
        setError('يجب إدخال رقم هاتف واحد على الأقل');
        setLoading(false);
        return;
      }

      await editUser(user.id, {
        username: formData.username,
        companyName: formData.companyName,
        phoneNumbers,
        role: formData.role
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحديث بيانات المستخدم');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneNumberChange = (index: number, value: string) => {
    const newPhoneNumbers = [...formData.phoneNumbers];
    newPhoneNumbers[index] = value;
    setFormData({ ...formData, phoneNumbers: newPhoneNumbers });
  };

  const addPhoneNumber = () => {
    setFormData({ ...formData, phoneNumbers: [...formData.phoneNumbers, ''] });
  };

  const removePhoneNumber = (index: number) => {
    const newPhoneNumbers = formData.phoneNumbers.filter((_, i) => i !== index);
    setFormData({ ...formData, phoneNumbers: newPhoneNumbers });
  };

  const roleOptions = [
    { value: UserRole.Admin, label: 'مدير النظام' },
    { value: UserRole.PosAgent, label: 'موظف نقطة بيع' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تعديل بيانات المستخدم">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            اسم المستخدم
          </label>
          <Input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="أدخل اسم المستخدم"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            اسم الشركة
          </label>
          <Input
            type="text"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder="أدخل اسم الشركة"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            الصلاحية
          </label>
          <Select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            options={roleOptions}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            أرقام الهواتف
          </label>
          {formData.phoneNumbers.map((phone, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <Input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneNumberChange(index, e.target.value)}
                placeholder={`رقم الهاتف ${index + 1}`}
                className="flex-1"
              />
              {formData.phoneNumbers.length > 1 && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => removePhoneNumber(index)}
                >
                  حذف
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPhoneNumber}
            className="mt-2"
          >
            إضافة رقم هاتف
          </Button>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            disabled={loading}
          >
            حفظ التغييرات
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditUserModal; 