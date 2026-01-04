{
  _id: ObjectId,
  patientId: ObjectId (ref: 'User', required),
  doctorId: ObjectId (ref: 'User', required),
  noteText: String (required),
  createdAt: Date,
  updatedAt: Date
}
