export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { username } = req.query;
  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const cleanUser = username.trim();

  try {
    let userId = null;
    let realName = cleanUser;
    let displayName = cleanUser;

    // 1. Try Exact Username Lookup First
    try {
      const exactRes = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [cleanUser], excludeBannedUsers: false })
      });

      if (exactRes.ok) {
        const exactData = await exactRes.json();
        if (exactData.data && exactData.data.length > 0 && exactData.data[0].id) {
          userId = exactData.data[0].id;
          realName = exactData.data[0].name || cleanUser;
          displayName = exactData.data[0].displayName || realName;
        }
      }
    } catch (e) {}

    // 2. Fallback to Search API if not found
    if (!userId) {
      try {
        const searchRes = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(cleanUser)}&limit=10`);
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.data && searchData.data.length > 0) {
            const matchedUser = searchData.data.find(
              u => u.name.toLowerCase() === cleanUser.toLowerCase() || u.displayName.toLowerCase() === cleanUser.toLowerCase()
            ) || searchData.data[0];

            userId = matchedUser.id;
            realName = matchedUser.name || cleanUser;
            displayName = matchedUser.displayName || realName;
          }
        }
      } catch (e) {}
    }

    if (!userId) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 3. Fetch Circular Avatar Headshot from Roblox CDN
    let avatarUrl = '';
    try {
      const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=true`);
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json();
        if (thumbData.data && thumbData.data.length > 0 && thumbData.data[0].imageUrl) {
          avatarUrl = thumbData.data[0].imageUrl;
        }
      }
    } catch (e) {}

    if (!avatarUrl) {
      avatarUrl = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=true`;
    }

    return res.status(200).json({
      success: true,
      id: userId,
      name: realName,
      displayName: displayName,
      avatarUrl: avatarUrl
    });
  } catch (err) {
    console.error('Roblox API Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
