import { useState, useCallback, useMemo } from 'react';
import { BusinessContext } from './useBusiness';

/**
 * Business-type-aware context mapping.
 * Each key = industry_type from templates.
 * Provides role labels, placeholders, terminology, and tone per business type.
 */
const BUSINESS_PROFILES = {
  beauty_salon: {
    label: 'Beauty Salon',
    icon: '💇',
    tone: 'friendly',
    roles: ['Stylist', 'Nail Technician', 'Colorist', 'Receptionist'],
    rolePlaceholder: 'e.g. Stylist, Colorist, Nail Technician',
    servicePlaceholder: 'e.g. Haircut, Balayage, Gel Nails',
    serviceNoun: 'treatment',
    serviceNounPlural: 'treatments',
    customerNoun: 'client',
    bookingVerb: 'book an appointment',
    teamNoun: 'staff',
  },
  clinic: {
    label: 'Medical Clinic',
    icon: '🏥',
    tone: 'formal',
    roles: ['Doctor', 'Nurse', 'Lab Technician', 'Receptionist'],
    rolePlaceholder: 'e.g. Doctor, Nurse, Lab Technician',
    servicePlaceholder: 'e.g. General Consultation, Blood Test',
    serviceNoun: 'service',
    serviceNounPlural: 'services',
    customerNoun: 'patient',
    bookingVerb: 'schedule an appointment',
    teamNoun: 'medical staff',
  },
  spa: {
    label: 'Spa & Wellness',
    icon: '🧖',
    tone: 'friendly',
    roles: ['Therapist', 'Massage Therapist', 'Esthetician', 'Receptionist'],
    rolePlaceholder: 'e.g. Therapist, Esthetician, Receptionist',
    servicePlaceholder: 'e.g. Swedish Massage, Facial, Body Wrap',
    serviceNoun: 'treatment',
    serviceNounPlural: 'treatments',
    customerNoun: 'guest',
    bookingVerb: 'book a session',
    teamNoun: 'therapists',
  },
  restaurant: {
    label: 'Restaurant & Cafe',
    icon: '🍽️',
    tone: 'friendly',
    roles: ['Server', 'Host', 'Chef', 'Event Coordinator', 'Manager'],
    rolePlaceholder: 'e.g. Server, Host, Event Coordinator',
    servicePlaceholder: 'e.g. Table Reservation, Private Dining, Catering',
    serviceNoun: 'offering',
    serviceNounPlural: 'offerings',
    customerNoun: 'guest',
    bookingVerb: 'make a reservation',
    teamNoun: 'staff',
  },
  sport_salon: {
    label: 'Sport & Fitness',
    icon: '🏋️',
    tone: 'friendly',
    roles: ['Trainer', 'Coach', 'Instructor', 'Front Desk'],
    rolePlaceholder: 'e.g. Trainer, Coach, Instructor',
    servicePlaceholder: 'e.g. Personal Training, Yoga Class, Membership',
    serviceNoun: 'class',
    serviceNounPlural: 'classes',
    customerNoun: 'member',
    bookingVerb: 'book a session',
    teamNoun: 'trainers',
  },
  real_estate: {
    label: 'Real Estate Agency',
    icon: '🏠',
    tone: 'formal',
    roles: ['Agent', 'Property Manager', 'Broker', 'Admin'],
    rolePlaceholder: 'e.g. Agent, Broker, Property Manager',
    servicePlaceholder: 'e.g. Property Viewing, Appraisal, Consultation',
    serviceNoun: 'service',
    serviceNounPlural: 'services',
    customerNoun: 'client',
    bookingVerb: 'request a viewing',
    teamNoun: 'agents',
  },
  car_rental: {
    label: 'Car Rental',
    icon: '🚗',
    tone: 'friendly',
    roles: ['Rental Agent', 'Fleet Manager', 'Customer Support'],
    rolePlaceholder: 'e.g. Rental Agent, Fleet Manager',
    servicePlaceholder: 'e.g. Economy Car, SUV, Weekly Rate',
    serviceNoun: 'vehicle',
    serviceNounPlural: 'vehicles',
    customerNoun: 'customer',
    bookingVerb: 'reserve a vehicle',
    teamNoun: 'staff',
  },
  driving_school: {
    label: 'Driving School',
    icon: '🚘',
    tone: 'friendly',
    roles: ['Instructor', 'Theory Teacher', 'Admin'],
    rolePlaceholder: 'e.g. Instructor, Theory Teacher',
    servicePlaceholder: 'e.g. Driving Lesson, Theory Course, Mock Test',
    serviceNoun: 'course',
    serviceNounPlural: 'courses',
    customerNoun: 'student',
    bookingVerb: 'enroll',
    teamNoun: 'instructors',
  },
  consulting: {
    label: 'Consulting Office',
    icon: '💼',
    tone: 'formal',
    roles: ['Consultant', 'Legal Advisor', 'Tax Advisor', 'Office Manager'],
    rolePlaceholder: 'e.g. Consultant, Legal Advisor, Tax Advisor',
    servicePlaceholder: 'e.g. Initial Consultation, Document Review',
    serviceNoun: 'service',
    serviceNounPlural: 'services',
    customerNoun: 'client',
    bookingVerb: 'schedule a consultation',
    teamNoun: 'consultants',
  },
};

const DEFAULT_PROFILE = {
  label: 'Business',
  icon: '🏢',
  tone: 'friendly',
  roles: [],
  rolePlaceholder: 'e.g. Manager, Receptionist, Specialist',
  servicePlaceholder: 'e.g. Consultation, Monthly Plan',
  serviceNoun: 'service',
  serviceNounPlural: 'services',
  customerNoun: 'customer',
  bookingVerb: 'book',
  teamNoun: 'team members',
};

const STORAGE_KEY = 'mvp_business_type';

export function BusinessProvider({ children }) {
  const [businessType, setBusinessTypeState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || null
  );

  const setBusinessType = useCallback((type) => {
    setBusinessTypeState(type);
    if (type) {
      localStorage.setItem(STORAGE_KEY, type);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const profile = useMemo(
    () => (businessType && BUSINESS_PROFILES[businessType]) || DEFAULT_PROFILE,
    [businessType]
  );

  const value = useMemo(
    () => ({ businessType, setBusinessType, profile, allProfiles: BUSINESS_PROFILES }),
    [businessType, setBusinessType, profile]
  );

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}
