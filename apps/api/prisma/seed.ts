import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clean up existing data (in reverse order of dependencies)
  await prisma.refreshToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.streamingProvider.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.familyInvitation.deleteMany();
  await prisma.familyMembership.deleteMany();
  await prisma.family.deleteMany();
  await prisma.watchlistEntry.deleteMany();
  await prisma.mediaItem.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  // Create demo users
  const user1 = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      password: 'hashed_password_1', // In production, use bcrypt or similar
      name: 'Alice',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      password: 'hashed_password_2',
      name: 'Bob',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'charlie@example.com',
      password: 'hashed_password_3',
      name: 'Charlie',
    },
  });

  // Create profiles for users
  await prisma.profile.create({
    data: {
      userId: user1.id,
      bio: 'Love movies and TV shows!',
      preferences: { theme: 'dark', language: 'en' },
    },
  });

  await prisma.profile.create({
    data: {
      userId: user2.id,
      bio: 'Sci-fi enthusiast',
      preferences: { theme: 'light', language: 'en' },
    },
  });

  await prisma.profile.create({
    data: {
      userId: user3.id,
      bio: 'Documentary lover',
      preferences: { theme: 'dark', language: 'es' },
    },
  });

  // Create demo media items (TMDB examples)
  const movie1 = await prisma.mediaItem.create({
    data: {
      tmdbId: 550,
      tmdbType: 'movie',
      title: 'Fight Club',
      description: 'An insomniac office worker and a devil-may-care soapmaker form an underground fight club...',
      posterPath: '/p64JHd3bGjH8qSEp0gyS1BFrP4V.jpg',
      backdropPath: '/a0JqB5VHx7q0D8dj4qcpFSMiR8e.jpg',
      releaseDate: new Date('1999-10-15'),
      rating: 8.8,
      genres: ['Drama', 'Thriller'],
      creators: ['David Fincher'],
    },
  });

  const movie2 = await prisma.mediaItem.create({
    data: {
      tmdbId: 278,
      tmdbType: 'movie',
      title: 'The Shawshank Redemption',
      description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
      posterPath: '/q6y0Go1tsGEsmtpSDb3kxcH9z0o.jpg',
      backdropPath: '/qiP0tFb3gMrW6wysZI2hlBudGVc.jpg',
      releaseDate: new Date('1994-09-23'),
      rating: 9.3,
      genres: ['Drama'],
      creators: ['Frank Darabont'],
    },
  });

  const tvShow = await prisma.mediaItem.create({
    data: {
      tmdbId: 1399,
      tmdbType: 'tv',
      title: 'Breaking Bad',
      description: 'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing methamphetamine...',
      posterPath: '/ggFHVNvVYapdOayUS6XRRtSaZc4.jpg',
      backdropPath: '/x2GZyKXw32edranZgzFnWKwgKSe.jpg',
      releaseDate: new Date('2008-01-20'),
      rating: 9.5,
      genres: ['Crime', 'Drama', 'Thriller'],
      creators: ['Vince Gilligan'],
    },
  });

  // Create watchlist entries
  await prisma.watchlistEntry.create({
    data: {
      userId: user1.id,
      mediaItemId: movie1.id,
      status: 'completed',
      rating: 9,
      notes: 'Amazing movie! Loved the plot twists.',
    },
  });

  await prisma.watchlistEntry.create({
    data: {
      userId: user1.id,
      mediaItemId: tvShow.id,
      status: 'watching',
      notes: 'Currently on Season 3',
    },
  });

  await prisma.watchlistEntry.create({
    data: {
      userId: user2.id,
      mediaItemId: movie2.id,
      status: 'not_watched',
    },
  });

  await prisma.watchlistEntry.create({
    data: {
      userId: user2.id,
      mediaItemId: tvShow.id,
      status: 'completed',
      rating: 10,
      notes: 'Best TV series ever!',
    },
  });

  // Create streaming providers
  await prisma.streamingProvider.create({
    data: {
      mediaItemId: movie1.id,
      provider: 'netflix',
      regions: ['US', 'CA', 'GB'],
    },
  });

  await prisma.streamingProvider.create({
    data: {
      mediaItemId: tvShow.id,
      provider: 'netflix',
      regions: ['US', 'CA', 'GB'],
    },
  });

  await prisma.streamingProvider.create({
    data: {
      mediaItemId: movie2.id,
      provider: 'prime_video',
      regions: ['US', 'CA'],
    },
  });

  // Create family
  const family = await prisma.family.create({
    data: {
      name: 'Movie Lovers',
      createdBy: user1.id,
    },
  });

  // Add family members
  await prisma.familyMembership.create({
    data: {
      userId: user1.id,
      familyId: family.id,
      role: 'admin',
    },
  });

  await prisma.familyMembership.create({
    data: {
      userId: user2.id,
      familyId: family.id,
      role: 'member',
    },
  });

  // Create family invitation
  const invitationToken = Math.random().toString(36).substring(7);
  await prisma.familyInvitation.create({
    data: {
      familyId: family.id,
      email: 'david@example.com',
      token: invitationToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Create recommendation
  await prisma.recommendation.create({
    data: {
      mediaItemId: movie1.id,
      recommendedBy: user1.id,
      recommendedTo: user2.id,
      message: 'You must watch this masterpiece!',
      status: 'pending',
    },
  });

  // Create session
  const sessionToken = Math.random().toString(36).substring(7);
  await prisma.session.create({
    data: {
      userId: user1.id,
      token: sessionToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  // Create refresh token
  const refreshToken = Math.random().toString(36).substring(7);
  await prisma.refreshToken.create({
    data: {
      userId: user1.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  console.log('Seed completed successfully!');
  console.log('Demo data created:');
  console.log(`- Users: ${user1.email}, ${user2.email}, ${user3.email}`);
  console.log(`- Media items: ${movie1.title}, ${movie2.title}, ${tvShow.title}`);
  console.log(`- Family: ${family.name}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
