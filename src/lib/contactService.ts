export async function sendContactMessage(formData: ContactFormData) {
  const { data, error } = await supabase
    .from('contact_messages')
    .insert([
      {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
      },
    ]);
  if (error) throw new Error(error.message);
  return data;
}