"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, updateUserProfile, getUserPlans } from '@/shared/firebase';
import { User, ChevronDown, Download, LogOut, ChevronLeft } from 'lucide-react';
import ProfileImageUploader from '@/components/ProfileImageUploader';
import BottomNavNew from '@/components/BottomNavNew';
import { Button } from '@/components/ui/button';
import countryData from 'react-phone-number-input/flags';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import MobileNavDrawer from '@/components/MobileNavDrawer';

// Simplified phone input mockup for design fidelity
const PhoneInputMockup = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
    <div className="flex h-[39px] w-full items-center gap-2 rounded-lg border border-[#454545] bg-[#212121] px-3">
        <div className="flex items-center gap-1 border-r border-[#454545] pr-2 mr-1">
            <img src="https://flagcdn.com/w20/us.png" alt="US" className="w-5 h-3.5 object-cover" />
            <ChevronDown className="w-3 h-3 text-white" />
        </div>
        <input
            type="tel"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-transparent text-white text-sm focus:outline-none w-full"
            placeholder="+1 (555) 000-0000"
        />
    </div>
);

type TabType = 'profile' | 'schedules';

interface UserData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    age: string;
    gender: string;
    height: string;
    weight: string;
    activityLevel: string;
    targetWeight: string;
    allergies: string;
    healthGoals: string;
    dietaryRestrictions: string;
}

export default function ProfilePage() {
    return (
        <ProtectedRoute>
            <ProfileContent />
        </ProtectedRoute>
    );
}

function ProfileContent() {
    const router = useRouter();
    const { user: currentUser, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const [userData, setUserData] = useState<UserData>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        age: '',
        gender: '',
        height: '',
        weight: '',
        activityLevel: '',
        targetWeight: '',
        allergies: '',
        healthGoals: '',
        dietaryRestrictions: '',
    });
    const [savedPlans, setSavedPlans] = useState<any[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({
        text: '',
        type: '',
    });

    useEffect(() => {
        const loadUserData = async () => {
            if (!currentUser?.uid) return;
            try {
                setLoading(true);
                const profileData = await getUserProfile(currentUser.uid);
                if (profileData) {
                    let firstName = '';
                    let lastName = '';
                    if (profileData.name) {
                        const nameParts = profileData.name.split(' ');
                        firstName = nameParts[0] || '';
                        lastName = nameParts.slice(1).join(' ') || '';
                    }
                    setUserData({
                        firstName: profileData.firstName || firstName || currentUser.displayName?.split(' ')[0] || '',
                        lastName: profileData.lastName || lastName || currentUser.displayName?.split(' ')[1] || '',
                        email: profileData.email || currentUser.email || '',
                        phone: profileData.phone || '',
                        age: profileData.age?.toString() || '',
                        gender: profileData.gender || '',
                        height: profileData.height?.toString() || '',
                        weight: profileData.weight?.toString() || '',
                        activityLevel: profileData.activityLevel || '',
                        targetWeight: profileData.targetWeight?.toString() || '',
                        allergies: profileData.allergies || '',
                        healthGoals: profileData.healthGoals || '',
                        dietaryRestrictions: profileData.dietaryRestrictions || '',
                    });
                } else {
                    setUserData({
                        firstName: currentUser.displayName?.split(' ')[0] || '',
                        lastName: currentUser.displayName?.split(' ')[1] || '',
                        email: currentUser.email || '',
                        phone: '',
                        age: '',
                        gender: '',
                        height: '',
                        weight: '',
                        activityLevel: '',
                        targetWeight: '',
                        allergies: '',
                        healthGoals: '',
                        dietaryRestrictions: '',
                    });
                }
            } catch (error) {
                console.error('Error loading user data:', error);
                setMessage({ text: 'Failed to load profile data', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        loadUserData();
    }, [currentUser]);

    // Fetch saved plans when tab switches
    useEffect(() => {
        const loadPlans = async () => {
            if (activeTab === 'schedules' && currentUser?.uid) {
                try {
                    setLoadingPlans(true);
                    const plans = await getUserPlans(currentUser.uid);
                    setSavedPlans(plans);
                } catch (error) {
                    console.error('Error loading plans:', error);
                } finally {
                    setLoadingPlans(false);
                }
            }
        };
        loadPlans();
    }, [activeTab, currentUser]);

    const handleInputChange = (field: keyof UserData, value: string) => {
        setUserData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!currentUser?.uid) return;
        setSaving(true);
        setMessage({ text: '', type: '' });
        try {
            const dataToSave = {
                firstName: userData.firstName,
                lastName: userData.lastName,
                name: `${userData.firstName} ${userData.lastName}`.trim(),
                email: userData.email,
                phone: userData.phone,
                age: userData.age ? parseInt(userData.age) : null,
                gender: userData.gender,
                height: userData.height ? parseInt(userData.height) : null,
                weight: userData.weight ? parseInt(userData.weight) : null,
                activityLevel: userData.activityLevel,
                targetWeight: userData.targetWeight ? parseInt(userData.targetWeight) : null,
                allergies: userData.allergies,
                healthGoals: userData.healthGoals,
                dietaryRestrictions: userData.dietaryRestrictions,
            };
            await updateUserProfile(currentUser.uid, dataToSave);
            setMessage({ text: 'Profile updated successfully!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ text: 'Failed to update profile. Please try again.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white">Loading profile...</div>
            </div>
        );
    }

    const statsData = [
        { value: `${userData.height || '172'} cm`, label: 'Height' },
        { value: `${userData.weight || '73'} kg`, label: 'Weight' },
        { value: `${userData.age || '27'} y`, label: 'Age' },
    ];

    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#ccd853] selection:text-black">

            {/* Mobile Header with Hamburger (mobile-only) */}
            <MobileNavDrawer title="Dashboard" />

            {/* Desktop Profile Bar */}
            <div className="hidden md:flex items-center justify-center bg-[#0D0D0D] border-b border-[#212121] h-16 relative">
                <button className="absolute left-4 md:left-16 w-8 h-8 flex items-center justify-center bg-[#ccd853] rounded-full hover:bg-[#b8c54a] transition-colors">
                    <ChevronLeft className="w-5 h-5 text-black" />
                </button>
                <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-[#e1e1e1]" />
                    <span className="text-lg font-bold text-[#e1e1e1]">Profile Section</span>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-12 pb-40">
                <div className="bg-[#0c0c0c] border border-[#212121] rounded-3xl overflow-hidden shadow-2xl">
                    {/* Hero Section */}
                    <div className="flex flex-col items-center pt-10 pb-8 px-8">
                        <div className="relative group">
                            <ProfileImageUploader
                                size="large"
                                onImageUploaded={url => console.log('Profile image updated:', url)}
                            />
                        </div>
                        <h2 className="mt-4 text-xl font-bold tracking-tight">
                            {userData.firstName} {userData.lastName}
                        </h2>
                        <p className="text-[#828282] text-sm mt-0.5">{userData.email}</p>

                        {/* Stats Widgets */}
                        <div className="grid grid-cols-3 gap-3 w-full max-w-xl mt-8">
                            {statsData.map((stat, idx) => (
                                <div key={idx} className="bg-[#0D0D0D] border border-[#212121] rounded-xl flex flex-col items-center justify-center py-4 px-2">
                                    <span className="text-lg font-bold">{stat.value}</span>
                                    <span className="text-[10px] text-[#828282] uppercase tracking-wider">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Horizontal Tabs */}
                    <div className="flex items-center justify-center border-t border-b border-[#212121] mt-4">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex items-center gap-2 py-4 px-8 border-b-2 transition-all ${activeTab === 'profile' ? 'border-[#ccd853] text-[#ccd853]' : 'border-transparent text-[#828282] hover:text-white'}`}
                        >
                            <User className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Profile Info</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('schedules')}
                            className={`flex items-center gap-2 py-4 px-8 border-b-2 transition-all ${activeTab === 'schedules' ? 'border-[#ccd853] text-[#ccd853]' : 'border-transparent text-[#828282] hover:text-white'}`}
                        >
                            <Download className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Saved Schedules</span>
                        </button>
                    </div>

                    {/* Tab Panels */}
                    <div className="p-8 md:p-12 lg:p-16">
                        {activeTab === 'profile' ? (
                            <div className="space-y-16">
                                {/* Personal Info */}
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#eeeeee] mb-8">Personal info</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#828282]">First Name</label>
                                            <input
                                                className="w-full h-10 border border-[#454545] bg-[#212121] rounded-lg px-4 text-sm focus:outline-none focus:border-[#ccd853] transition-colors"
                                                value={userData.firstName}
                                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#828282]">Last Name</label>
                                            <input
                                                className="w-full h-10 border border-[#454545] bg-[#212121] rounded-lg px-4 text-sm focus:outline-none focus:border-[#ccd853] transition-colors"
                                                value={userData.lastName}
                                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#828282]">Email</label>
                                            <input
                                                className="w-full h-10 border border-[#454545] bg-[#212121] rounded-lg px-4 text-sm focus:outline-none cursor-not-allowed opacity-60"
                                                value={userData.email} readOnly
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#828282]">Phone</label>
                                            <PhoneInputMockup
                                                value={userData.phone}
                                                onChange={(val) => handleInputChange('phone', val)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#828282]">Age</label>
                                            <input
                                                type="number"
                                                className="w-full h-10 border border-[#454545] bg-[#212121] rounded-lg px-4 text-sm focus:outline-none focus:border-[#ccd853] transition-colors"
                                                value={userData.age}
                                                onChange={(e) => handleInputChange('age', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#828282]">Gender</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full h-10 border border-[#454545] bg-[#212121] rounded-lg px-4 text-sm appearance-none focus:outline-none focus:border-[#ccd853] transition-colors"
                                                    value={userData.gender}
                                                    onChange={(e) => handleInputChange('gender', e.target.value)}
                                                >
                                                    <option value="male">Male</option>
                                                    <option value="female">Female</option>
                                                    <option value="other">Other</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#828282] pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Health Info */}
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#eeeeee] mb-8">Health Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-10">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#828282]">Height</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="w-full h-10 border border-[#454545] bg-[#212121] rounded-lg px-4 text-sm pr-12 focus:outline-none focus:border-[#ccd853] transition-colors"
                                                    value={userData.height}
                                                    onChange={(e) => handleInputChange('height', e.target.value)}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#828282]">cm</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#828282]">Weight</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="w-full h-10 border border-[#454545] bg-[#212121] rounded-lg px-4 text-sm pr-12 focus:outline-none focus:border-[#ccd853] transition-colors"
                                                    value={userData.weight}
                                                    onChange={(e) => handleInputChange('weight', e.target.value)}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#828282]">kg</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#828282]">Activity Level</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full h-10 border border-[#454545] bg-[#212121] rounded-lg px-4 text-sm appearance-none focus:outline-none focus:border-[#ccd853] transition-colors"
                                                    value={userData.activityLevel}
                                                    onChange={(e) => handleInputChange('activityLevel', e.target.value)}
                                                >
                                                    <option value="sedentary">Sedentary</option>
                                                    <option value="moderate">Moderate</option>
                                                    <option value="active">Active</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#828282] pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Textareas */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-10 mt-10">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#828282]">Health Goals</label>
                                            <textarea
                                                className="w-full h-24 border border-[#454545] bg-[#212121] rounded-lg p-4 text-sm resize-none focus:outline-none focus:border-[#ccd853] transition-colors"
                                                placeholder="Enter your health goals..."
                                                value={userData.healthGoals}
                                                onChange={(e) => handleInputChange('healthGoals', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#828282]">Target Weight</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="w-full h-10 border border-[#454545] bg-[#212121] rounded-lg px-4 text-sm pr-12 focus:outline-none focus:border-[#ccd853] transition-colors"
                                                    value={userData.targetWeight}
                                                    onChange={(e) => handleInputChange('targetWeight', e.target.value)}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#828282]">kg</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dietary & Allergies */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-10 mt-10">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#828282]">Dietary Restrictions</label>
                                            <textarea
                                                className="w-full h-24 border border-[#454545] bg-[#212121] rounded-lg p-4 text-sm resize-none focus:outline-none focus:border-[#ccd853] transition-colors"
                                                placeholder="Eg., No dairy, Vegetarian..."
                                                value={userData.dietaryRestrictions}
                                                onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#828282]">Allergies</label>
                                            <textarea
                                                className="w-full h-24 border border-[#454545] bg-[#212121] rounded-lg p-4 text-sm resize-none focus:outline-none focus:border-[#ccd853] transition-colors"
                                                placeholder="Eg., Peanuts, Shellfish..."
                                                value={userData.allergies}
                                                onChange={(e) => handleInputChange('allergies', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div className="flex justify-end pt-8">
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="bg-[#ccd853] text-black font-bold h-12 px-12 rounded-xl hover:bg-[#b8c54a] transition-all transform active:scale-95"
                                    >
                                        {saving ? 'SAVING...' : 'SAVE CHANGES'}
                                    </Button>
                                </div>
                                {message.text && (
                                    <p className={`text-center text-sm font-bold ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                        {message.text}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#eeeeee]">Previous Schedules</h3>
                                    {savedPlans.length > 0 && (
                                        <span className="text-[10px] font-bold text-[#828282] uppercase tracking-wider bg-[#212121] px-3 py-1 rounded-full">
                                            {savedPlans.length} Total
                                        </span>
                                    )}
                                </div>

                                {loadingPlans ? (
                                    <div className="flex justify-center py-20">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : savedPlans.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {savedPlans.map((plan) => (
                                            <div
                                                key={plan.id}
                                                onClick={() => router.push(`/schedule?planId=${plan.id}`)}
                                                className="group bg-[#0D0D0D] border border-[#212121] rounded-2xl p-6 hover:border-primary transition-all cursor-pointer"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="h-10 w-10 flex items-center justify-center bg-primary/10 rounded-xl">
                                                        <span className="text-lg">📅</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/20">
                                                        {plan.calculatedData?.targetCalories || 0} kcal
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{plan.name}</h4>
                                                <p className="text-[10px] text-[#828282] mt-1 font-medium flex items-center gap-1.5 uppercase tracking-wider">
                                                    Created {new Date(plan.createdAt?.seconds * 1000).toLocaleDateString()}
                                                </p>
                                                <div className="mt-6 flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-[#828282]">{plan.calculatedData?.workoutFocus || 'GENERAL'}</span>
                                                    <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                                                        VIEW PLAN <ChevronLeft className="w-3 h-3 rotate-180" />
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-[#828282]">
                                        <Download className="w-12 h-12 mb-4 opacity-20" />
                                        <p className="text-sm font-medium">No saved schedules found.</p>
                                        <button
                                            onClick={() => router.push('/ai-coach/details')}
                                            className="mt-6 text-[10px] font-bold text-primary hover:underline border border-primary/30 px-4 py-2 rounded-xl"
                                        >
                                            CREATE YOUR FIRST PLAN
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Logout floating button for mobile */}
            <button
                onClick={() => logout()}
                className="fixed bottom-32 right-6 md:hidden w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
                <LogOut className="w-5 h-5 text-white" />
            </button>

            <BottomNavNew />
        </div>
    );
}
