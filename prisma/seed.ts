import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clear existing data in reverse order of dependencies
  await prisma.inventoryTransaction.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.labResult.deleteMany({});
  await prisma.labOrder.deleteMany({});
  await prisma.admission.deleteMany({});
  await prisma.bed.deleteMany({});
  await prisma.ward.deleteMany({});
  await prisma.messageReadReceipt.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversationParticipant.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.referral.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.medicalRecord.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.doctorAvailability.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.user.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123', salt);

  // 2. Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@caresync.com',
      passwordHash,
      role: 'admin',
    },
  });

  // 3. Create Departments
  const cardiologyDept = await prisma.department.create({
    data: {
      name: 'Cardiology',
      description: 'Department dealing with disorders of the heart and blood vessels.',
    },
  });

  const generalMedicineDept = await prisma.department.create({
    data: {
      name: 'General Medicine',
      description: 'Primary care and non-surgical treatment of internal diseases.',
    },
  });

  const laboratoryDept = await prisma.department.create({
    data: {
      name: 'Laboratory',
      description: 'Clinical laboratory services for diagnostic testing.',
    },
  });

  const pharmacyDept = await prisma.department.create({
    data: {
      name: 'Pharmacy',
      description: 'Dispensing and review of medications.',
    },
  });

  // 4. Create Doctors
  const doc1User = await prisma.user.create({
    data: {
      email: 'cardio.doc@caresync.com',
      passwordHash,
      role: 'doctor',
    },
  });

  const doc1 = await prisma.doctor.create({
    data: {
      userId: doc1User.id,
      specialization: 'Cardiologist',
      licenseNumber: 'MDC-CARD-8839',
      bio: 'Expert in interventional cardiology and cardiovascular research.',
      consultDurationMin: 20,
      departmentId: cardiologyDept.id,
    },
  });

  const doc2User = await prisma.user.create({
    data: {
      email: 'gen.doc@caresync.com',
      passwordHash,
      role: 'doctor',
    },
  });

  const doc2 = await prisma.doctor.create({
    data: {
      userId: doc2User.id,
      specialization: 'General Practitioner',
      licenseNumber: 'MDC-GENP-9921',
      bio: 'Family physician dedicated to comprehensive community healthcare.',
      consultDurationMin: 15,
      departmentId: generalMedicineDept.id,
    },
  });

  const doc3User = await prisma.user.create({
    data: {
      email: 'emer.doc@caresync.com',
      passwordHash,
      role: 'doctor',
    },
  });

  const doc3 = await prisma.doctor.create({
    data: {
      userId: doc3User.id,
      specialization: 'Emergency Specialist',
      licenseNumber: 'MDC-EMER-4412',
      bio: 'Experienced trauma care specialist operating under high pressure.',
      consultDurationMin: 15,
      departmentId: generalMedicineDept.id,
    },
  });

  // Assign head doctors
  await prisma.department.update({
    where: { id: cardiologyDept.id },
    data: { headDoctorId: doc1.id },
  });

  await prisma.department.update({
    where: { id: generalMedicineDept.id },
    data: { headDoctorId: doc2.id },
  });

  // 5. Create Staff Members
  const nurseUser = await prisma.user.create({
    data: {
      email: 'nurse@caresync.com',
      passwordHash,
      role: 'staff',
    },
  });

  const nurseStaff = await prisma.staff.create({
    data: {
      userId: nurseUser.id,
      departmentId: generalMedicineDept.id,
      position: 'Nurse',
    },
  });

  const labTechUser = await prisma.user.create({
    data: {
      email: 'labtech@caresync.com',
      passwordHash,
      role: 'staff',
    },
  });

  const labTechStaff = await prisma.staff.create({
    data: {
      userId: labTechUser.id,
      departmentId: laboratoryDept.id,
      position: 'Lab Technician',
    },
  });

  const pharmacistUser = await prisma.user.create({
    data: {
      email: 'pharmacist@caresync.com',
      passwordHash,
      role: 'staff',
    },
  });

  const pharmacistStaff = await prisma.staff.create({
    data: {
      userId: pharmacistUser.id,
      departmentId: pharmacyDept.id,
      position: 'Pharmacist',
    },
  });

  const receptionistUser = await prisma.user.create({
    data: {
      email: 'receptionist@caresync.com',
      passwordHash,
      role: 'staff',
    },
  });

  const receptionistStaff = await prisma.staff.create({
    data: {
      userId: receptionistUser.id,
      departmentId: generalMedicineDept.id,
      position: 'Receptionist',
    },
  });

  // 6. Create Doctor Availability (Slots: Mon-Fri, 9:00 - 17:00)
  const days = [1, 2, 3, 4, 5]; // Mon to Fri
  for (const doc of [doc1, doc2, doc3]) {
    for (const day of days) {
      await prisma.doctorAvailability.create({
        data: {
          doctorId: doc.id,
          dayOfWeek: day,
          startTime: new Date('1970-01-01T09:00:00Z'),
          endTime: new Date('1970-01-01T17:00:00Z'),
        },
      });
    }
  }

  // 7. Create 8 Patients (Ghanaian settings: Phone format + NHIS number)
  const patientData = [
    { name: 'Kofi Mensah', email: 'kofi.mensah@gmail.com', dob: '1988-05-12', gender: 'male' as const, phone: '+233241234567', nhis: 'NHIS-11223344' },
    { name: 'Ama Serwaa', email: 'ama.serwaa@gmail.com', dob: '1995-09-24', gender: 'female' as const, phone: '+233247654321', nhis: 'NHIS-99887766' },
    { name: 'Kwame Osei', email: 'kwame.osei@gmail.com', dob: '1990-11-02', gender: 'male' as const, phone: '+233201112223', nhis: 'NHIS-55667788' },
    { name: 'Esi Boateng', email: 'esi.boateng@gmail.com', dob: '2001-02-15', gender: 'female' as const, phone: '+233554443332', nhis: 'NHIS-22334455' },
    { name: 'Yaw Appiah', email: 'yaw.appiah@gmail.com', dob: '1975-07-30', gender: 'male' as const, phone: '+233276667778', nhis: null },
    { name: 'Abena Ofori', email: 'abena.ofori@gmail.com', dob: '1992-04-18', gender: 'female' as const, phone: '+233549998887', nhis: 'NHIS-44556677' },
    { name: 'Kweku Addo', email: 'kweku.addo@gmail.com', dob: '1983-12-05', gender: 'male' as const, phone: '+233245554443', nhis: 'NHIS-88990011' },
    { name: 'Afia Nyarko', email: 'afia.nyarko@gmail.com', dob: '1998-08-08', gender: 'female' as const, phone: '+233202223334', nhis: 'NHIS-12345678' },
  ];

  const patients = [];
  for (const p of patientData) {
    const user = await prisma.user.create({
      data: {
        email: p.email,
        passwordHash,
        role: 'patient',
      },
    });

    const patient = await prisma.patient.create({
      data: {
        userId: user.id,
        dateOfBirth: new Date(p.dob),
        gender: p.gender,
        phone: p.phone,
        address: 'Accra, Ghana',
        nhisNumber: p.nhis,
        emergencyContact: 'Family Member (' + p.phone + ')',
      },
    });
    patients.push(patient);
  }

  // 8. Create Appointments (Past and Future)
  const now = new Date();
  const appointments = [];

  // Generate varied status past/future appointments
  for (let i = 0; i < 20; i++) {
    const patientIndex = i % patients.length;
    const docIndex = i % 3;
    const selectedDoc = [doc1, doc2, doc3][docIndex];
    const isPast = i < 12;
    const statusVal = isPast
      ? (i % 4 === 0 ? 'completed' as const : i % 4 === 1 ? 'cancelled' as const : i % 4 === 2 ? 'no_show' as const : 'completed' as const)
      : (i % 3 === 0 ? 'pending' as const : 'confirmed' as const);

    const scheduledDate = new Date();
    if (isPast) {
      scheduledDate.setDate(now.getDate() - (i + 1));
      scheduledDate.setHours(9 + (i % 6), i % 2 === 0 ? 0 : 30, 0, 0);
    } else {
      scheduledDate.setDate(now.getDate() + (i - 11));
      scheduledDate.setHours(10 + (i % 5), i % 2 === 0 ? 0 : 30, 0, 0);
    }

    const appt = await prisma.appointment.create({
      data: {
        patientId: patients[patientIndex].id,
        doctorId: selectedDoc.id,
        scheduledAt: scheduledDate,
        status: statusVal,
        reason: 'Regular consultation checkup number ' + (i + 1),
        queuePosition: statusVal === 'confirmed' || statusVal === 'pending' ? (i % 5) + 1 : null,
      },
    });
    appointments.push(appt);

    // Payments for appointments
    if (statusVal === 'completed' || statusVal === 'confirmed') {
      await prisma.payment.create({
        data: {
          appointmentId: appt.id,
          amount: 150.00, // GHS
          method: i % 2 === 0 ? 'mobile_money' : 'cash',
          status: statusVal === 'completed' ? 'paid' : 'pending',
          transactionRef: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        },
      });
    }

    // Medical record + prescriptions + audit log for completed appointments
    if (statusVal === 'completed') {
      const rec = await prisma.medicalRecord.create({
        data: {
          patientId: patients[patientIndex].id,
          doctorId: selectedDoc.id,
          appointmentId: appt.id,
          diagnosis: i % 2 === 0 ? 'Essential Hypertension' : 'Acute Pharyngitis',
          notes: 'Patient presented with clinical symptoms. Advised lifestyle modifications and prescribed medication.',
        },
      });

      // Prescription
      await prisma.prescription.create({
        data: {
          medicalRecordId: rec.id,
          medication: i % 2 === 0 ? 'Amlodipine 5mg' : 'Amoxicillin 500mg',
          dosage: i % 2 === 0 ? 'Once daily' : 'Three times daily',
          instructions: i % 2 === 0 ? 'Take in the morning with water.' : 'Complete the full course of 7 days.',
        },
      });

      // Uploaded Document mockup
      const doc = await prisma.document.create({
        data: {
          medicalRecordId: rec.id,
          fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
          fileType: 'pdf',
          uploadedById: selectedDoc.userId,
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: selectedDoc.userId,
          action: 'CREATE',
          entityType: 'medical_records',
          entityId: rec.id,
        },
      });
    }
  }

  // 9. Referrals (2-3 in different statuses)
  // Referral 1: General Medicine (doc2) -> Cardiology (doc1), Pending
  const ref1 = await prisma.referral.create({
    data: {
      patientId: patients[0].id,
      referringDoctorId: doc2.id,
      referringDepartmentId: generalMedicineDept.id,
      referredToDepartmentId: cardiologyDept.id,
      referredToDoctorId: doc1.id,
      reason: 'Patient exhibits persistent murmurs and high blood pressure.',
      status: 'pending',
    },
  });

  // Conversation thread for Referral 1
  const conv1 = await prisma.conversation.create({
    data: {
      type: 'case',
      relatedPatientId: patients[0].id,
      relatedReferralId: ref1.id,
    },
  });

  await prisma.conversationParticipant.createMany({
    data: [
      { conversationId: conv1.id, userId: doc2User.id },
      { conversationId: conv1.id, userId: doc1User.id },
    ],
  });

  await prisma.message.create({
    data: {
      conversationId: conv1.id,
      senderId: doc2User.id,
      content: 'Hello Dr. Cardio, I referred Kofi. He has persistent chest pains during exercise.',
    },
  });

  // Referral 2: General Medicine (doc2) -> Laboratory, Completed
  const ref2 = await prisma.referral.create({
    data: {
      patientId: patients[1].id,
      referringDoctorId: doc2.id,
      referringDepartmentId: generalMedicineDept.id,
      referredToDepartmentId: laboratoryDept.id,
      reason: 'Urgent Full Blood Count and Lipid Profile required.',
      status: 'completed',
    },
  });

  // 10. Wards and Beds
  const femaleWard = await prisma.ward.create({
    data: {
      name: 'Female General Ward A',
      departmentId: generalMedicineDept.id,
      capacity: 3,
    },
  });

  const bed1 = await prisma.bed.create({
    data: {
      wardId: femaleWard.id,
      bedNumber: 'B1',
      status: 'occupied',
    },
  });

  const bed2 = await prisma.bed.create({
    data: {
      wardId: femaleWard.id,
      bedNumber: 'B2',
      status: 'available',
    },
  });

  const bed3 = await prisma.bed.create({
    data: {
      wardId: femaleWard.id,
      bedNumber: 'B3',
      status: 'available',
    },
  });

  // Active Admission (Ama Serwaa in Bed B1)
  await prisma.admission.create({
    data: {
      patientId: patients[1].id,
      bedId: bed1.id,
      admittingDoctorId: doc2.id,
      reason: 'Severe dehydration and clinical observation.',
      status: 'admitted',
      admittedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
    },
  });

  // 11. Lab Orders
  // Lab Order 1: Completed with Result
  const labOrder1 = await prisma.labOrder.create({
    data: {
      patientId: patients[2].id,
      orderingDoctorId: doc2.id,
      departmentId: laboratoryDept.id,
      testName: 'Lipid Profile',
      status: 'completed',
      orderedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 40 * 60 * 60 * 1000),
    },
  });

  await prisma.labResult.create({
    data: {
      labOrderId: labOrder1.id,
      resultSummary: 'Cholesterol: 240 mg/dL (High), LDL: 160 mg/dL (High), HDL: 45 mg/dL (Normal).',
      recordedById: labTechUser.id,
    },
  });

  // Lab Order 2: Ordered (Pending)
  await prisma.labOrder.create({
    data: {
      patientId: patients[3].id,
      orderingDoctorId: doc1.id,
      departmentId: laboratoryDept.id,
      testName: 'Cardiac Troponin T',
      status: 'ordered',
      orderedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
  });

  // 12. Inventory Items
  const inv1 = await prisma.inventoryItem.create({
    data: {
      name: 'Amoxicillin 500mg',
      category: 'medication',
      unit: 'tablet',
      quantityInStock: 250,
      reorderLevel: 50,
      departmentId: pharmacyDept.id,
    },
  });

  const inv2 = await prisma.inventoryItem.create({
    data: {
      name: 'Amlodipine 5mg',
      category: 'medication',
      unit: 'tablet',
      quantityInStock: 8, // Below reorder level!
      reorderLevel: 20,
      departmentId: pharmacyDept.id,
    },
  });

  const inv3 = await prisma.inventoryItem.create({
    data: {
      name: 'Syringes 5ml',
      category: 'supply',
      unit: 'piece',
      quantityInStock: 500,
      reorderLevel: 100,
      departmentId: generalMedicineDept.id,
    },
  });

  // Transaction Logs
  await prisma.inventoryTransaction.create({
    data: {
      itemId: inv1.id,
      changeQuantity: 300,
      reason: 'Monthly Restock',
      performedById: pharmacistUser.id,
    },
  });

  await prisma.inventoryTransaction.create({
    data: {
      itemId: inv1.id,
      changeQuantity: -50,
      reason: 'Dispensed for Prescription',
      performedById: pharmacistUser.id,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
