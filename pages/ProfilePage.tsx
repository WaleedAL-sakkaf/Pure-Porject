
import React, { useState, useEffect, ChangeEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { User, Lock, Save, Phone, PlusCircle, XCircle, Briefcase, KeyRound, UserSquare } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import * as authService from '../services/authService'; 

const MAX_PHONE_NUMBERS = 4;

const ProfilePage: React.FC = () => {
  const { currentUser, isLoadingAuth, refreshCurrentUser } = useAuth(); 

  const [editableCompanyName, setEditableCompanyName] = useState('');
  const [editablePhoneNumbers, setEditablePhoneNumbers] = useState<string[]>(['']);
  
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);


  useEffect(() => {
    if (currentUser) {
      setEditableCompanyName(currentUser.companyName || '');
      setEditablePhoneNumbers(currentUser.phoneNumbers && currentUser.phoneNumbers.length > 0 ? [...currentUser.phoneNumbers] : ['']);
    }
  }, [currentUser]);

  const resetMessages = () => {
    setProfileError('');
    setProfileSuccess('');
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handlePhoneNumberChange = (index: number, value: string) => {
    resetMessages();
    const newPhoneNumbers = [...editablePhoneNumbers];
    newPhoneNumbers[index] = value;
    setEditablePhoneNumbers(newPhoneNumbers);
  };

  const addPhoneNumberField = () => {
    resetMessages();
    if (editablePhoneNumbers.length < MAX_PHONE_NUMBERS) {
      setEditablePhoneNumbers([...editablePhoneNumbers, '']);
    }
  };

  const removePhoneNumberField = (index: number) => {
    resetMessages();
    if (editablePhoneNumbers.length > 1) {
        const newPhoneNumbers = editablePhoneNumbers.filter((_, i) => i !== index);
        setEditablePhoneNumbers(newPhoneNumbers);
    } else if (editablePhoneNumbers.length === 1 && editablePhoneNumbers[0] !== '') {
        setEditablePhoneNumbers(['']); // Clear if only one and it's removed
    }
  };
  
  const validateProfileChanges = (): boolean => {
    if (!editableCompanyName.trim()) {
      setProfileError('اسم الشركة مطلوب.');
      return false;
    }
    const activePhoneNumbers = editablePhoneNumbers.map(p => p.trim()).filter(p => p !== '');
    if (activePhoneNumbers.length === 0) {
      setProfileError('يجب إدخال رقم هاتف واحد على الأقل.');
      return false;
    }
    for (const phone of activePhoneNumbers) {
      if (!/^05\d{8}$/.test(phone) && !/^\d{7,9}$/.test(phone)) { 
         setProfileError(`رقم الهاتف "${phone}" غير صالح. يجب أن يكون بتنسيق صحيح (مثل 05xxxxxxxx أو رقم أرضي).`);
         return false;
      }
    }
    return true;
  };

  const handleProfileChangesSave = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!validateProfileChanges()) {
      return;
    }
    
    setIsSavingProfile(true);
    try {
      const activePhoneNumbers = editablePhoneNumbers.map(p => p.trim()).filter(p => p !== '');
      const updatedUser = await authService.updateUserProfile(currentUser!.id, { // currentUser is guaranteed here
        companyName: editableCompanyName,
        phoneNumbers: activePhoneNumbers,
      });
      if (updatedUser) {
        await refreshCurrentUser(); 
        setProfileSuccess('تم حفظ تغييرات الملف الشخصي بنجاح!');
      } else {
        setProfileError('فشل في حفظ التغييرات. المستخدم غير موجود.');
      }
    } catch (err: any) {
      setProfileError(err.message || 'حدث خطأ أثناء حفظ التغييرات.');
    } finally {
      setIsSavingProfile(false);
    }
  };


  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!currentPassword) {
      setPasswordError('كلمة المرور الحالية مطلوبة.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('كلمتا المرور الجديدتان غير متطابقتين.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.');
      return;
    }
    
    setIsChangingPassword(true);
    // Placeholder for actual password change logic
    // In a real app, this would involve an API call:
    // try {
    //   await authService.changePassword(currentUser.id, currentPassword, newPassword);
    //   setPasswordSuccess('تم تغيير كلمة المرور بنجاح!');
    //   setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
    // } catch (err) {
    //   setPasswordError(err.message || 'فشل تغيير كلمة المرور.');
    // } finally {
    //   setIsChangingPassword(false);
    // }
    console.log('Attempting to change password for:', currentUser!.username, { currentPassword, newPassword });
    setTimeout(() => { // Simulate API call
        setPasswordError('وظيفة تغيير كلمة المرور غير مفعلة في هذا العرض التوضيحي.');
        // setPasswordSuccess('تم طلب تغيير كلمة المرور (وظيفة صورية، لم يتم التنفيذ بعد).');
        // setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
        setIsChangingPassword(false);
    }, 1000);
  };

  if (isLoadingAuth && !currentUser) {
    return <div className="min-h-[400px] flex items-center justify-center"><LoadingSpinner text="جاري تحميل بيانات الملف الشخصي..." /></div>;
  }

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-full p-6">
        <Card title="خطأ">
          <p className="text-center text-red-500 dark:text-red-400">
            الرجاء تسجيل الدخول لعرض هذه الصفحة.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">إعدادات الملف الشخصي</h1>
      </div>

      <form onSubmit={handleProfileChangesSave}>
        <Card 
          title="معلومات الحساب" 
          titleClassName="flex items-center gap-2 text-lg"
          actions={
            <Button 
                type="submit"
                variant="primary" 
                leftIcon={<Save size={18}/>} 
                isLoading={isSavingProfile}
                disabled={isLoadingAuth}
            >
                حفظ التغييرات
            </Button>
          }
        >
          {/* <User size={20} className="text-primary me-2 hidden sm:inline" />  Icon can be part of title prop if Card supports it, or here*/}
          <div className="space-y-4 p-1">
            {profileError && <p className="text-sm text-red-500 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/30 rounded-md text-center">{profileError}</p>}
            {profileSuccess && <p className="text-sm text-green-500 dark:text-green-400 p-2 bg-green-50 dark:bg-green-900/30 rounded-md text-center">{profileSuccess}</p>}
            
            <Input label="اسم المستخدم (غير قابل للتعديل)" value={currentUser.username} readOnly disabled wrapperClassName="mb-0" leftIcon={<User size={16} className="text-muted-foreground"/>}/>
            <Input 
              label="اسم الشركة" 
              name="companyName"
              value={editableCompanyName} 
              onChange={(e) => { setEditableCompanyName(e.target.value); resetMessages(); }}
              wrapperClassName="mb-0"
              leftIcon={<Briefcase size={16} className="text-muted-foreground"/>}
            />
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                أرقام الهواتف (1 مطلوب، حتى {MAX_PHONE_NUMBERS} كحد أقصى):
              </label>
              {editablePhoneNumbers.map((phone, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <Input
                    name={`phoneNumber-${index}`}
                    type="tel"
                    placeholder={`رقم الهاتف ${index + 1}`}
                    value={phone}
                    onChange={(e) => handlePhoneNumberChange(index, e.target.value)}
                    leftIcon={<Phone size={16} className="text-muted-foreground"/>}
                    wrapperClassName="flex-grow mb-0"
                    aria-label={`رقم الهاتف ${index + 1}`}
                  />
                  {editablePhoneNumbers.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removePhoneNumberField(index)} 
                      className="text-red-500 hover:bg-red-500/10 p-2" 
                      aria-label={`إزالة رقم الهاتف ${index + 1}`}
                      title="إزالة رقم الهاتف"
                    >
                      <XCircle size={20} />
                    </Button>
                  )}
                </div>
              ))}
              {editablePhoneNumbers.length < MAX_PHONE_NUMBERS && (
                <Button 
                  type="button" 
                  variant="link" 
                  size="sm" 
                  onClick={addPhoneNumberField} 
                  leftIcon={<PlusCircle size={16}/>} 
                  className="text-primary dark:text-primary-light p-0"
                >
                  إضافة رقم هاتف آخر
                </Button>
              )}
            </div>
            <Input label="الدور" value={currentUser.role} readOnly disabled wrapperClassName="mb-0" leftIcon={<UserSquare size={16} className="text-muted-foreground"/>}/>
          </div>
        </Card>
      </form>

      <form onSubmit={handlePasswordChange}>
        <Card title="تغيير كلمة المرور" titleClassName="flex items-center gap-2 text-lg">
          {/* <Lock size={20} className="text-orange-500 dark:text-orange-400 me-2 hidden sm:inline" /> */}
          <div className="space-y-4 p-1">
            {passwordError && <p className="text-sm text-red-500 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/30 rounded-md text-center">{passwordError}</p>}
            {passwordSuccess && <p className="text-sm text-green-500 dark:text-green-400 p-2 bg-green-50 dark:bg-green-900/30 rounded-md text-center">{passwordSuccess}</p>}
            <Input
              label="كلمة المرور الحالية"
              type="password"
              name="currentPassword"
              value={currentPassword}
              onChange={(e) => {setCurrentPassword(e.target.value); resetMessages();}}
              placeholder="اتركها فارغة إذا لم يتم تفعيلها بعد"
              wrapperClassName="mb-0"
              autoComplete="current-password"
              leftIcon={<KeyRound size={16} className="text-muted-foreground"/>}
            />
            <Input
              label="كلمة المرور الجديدة"
              type="password"
              name="newPassword"
              value={newPassword}
              onChange={(e) => {setNewPassword(e.target.value); resetMessages();}}
              wrapperClassName="mb-0"
              autoComplete="new-password"
              leftIcon={<KeyRound size={16} className="text-muted-foreground"/>}
            />
            <Input
              label="تأكيد كلمة المرور الجديدة"
              type="password"
              name="confirmNewPassword"
              value={confirmNewPassword}
              onChange={(e) => {setConfirmNewPassword(e.target.value); resetMessages();}}
              wrapperClassName="mb-0"
              autoComplete="new-password"
              leftIcon={<KeyRound size={16} className="text-muted-foreground"/>}
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" leftIcon={<Save size={16} />} isLoading={isChangingPassword} disabled>
                تغيير كلمة المرور (معطل)
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default ProfilePage;
