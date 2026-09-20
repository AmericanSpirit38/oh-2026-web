export const fetchCiphers = async () => {
  const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ciphers/`);
  const ciphers = await r.json()
  return { ciphers: ciphers };
};

export const fetchCipherSubmissions = async () => {
  const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cipher-submissions/`);
  return await r.json()
};
