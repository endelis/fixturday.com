const LIST_ID = 'f5ce3064-7e8f-11f1-bd67-abbb25c57621'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, firstName, lastName } = req.body ?? {}
  if (!email) return res.status(400).json({ success: false })

  try {
    const response = await fetch(
      `https://emailoctopus.com/api/1.6/lists/${LIST_ID}/contacts`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.EMAILOCTOPUS_API_KEY,
          email_address: email,
          fields: {
            FirstName: firstName || '',
            LastName: lastName || '',
          },
          status: 'SUBSCRIBED',
        }),
      }
    )
    const data = await response.json()
    // Already subscribed is not an error
    if (!response.ok && data?.error?.code !== 'MEMBER_EXISTS_WITH_EMAIL_ADDRESS') {
      return res.status(500).json({ success: false })
    }
    return res.status(200).json({ success: true })
  } catch {
    return res.status(500).json({ success: false })
  }
}
