import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Demo user credentials for documentation
export const DEMO_USERS = {
  alice: { email: 'alice@example.com', password: 'password123', name: 'Alice Johnson' },
  bob: { email: 'bob@example.com', password: 'password123', name: 'Bob Smith' },
  charlie: { email: 'charlie@example.com', password: 'password123', name: 'Charlie Davis' },
  diana: { email: 'diana@example.com', password: 'password123', name: 'Diana Martinez' },
  evan: { email: 'evan@example.com', password: 'password123', name: 'Evan Wilson' },
  fiona: { email: 'fiona@example.com', password: 'password123', name: 'Fiona Chen' },
  george: { email: 'george@example.com', password: 'password123', name: 'George (Kid)' },
  henry: { email: 'henry@example.com', password: 'password123', name: 'Henry (Teen)' }
};

async function main() {
  console.log('🌱 Starting enhanced seed...');

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

  console.log('🧹 Cleaned up existing data');

  // Helper function to hash passwords
  const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, 12);
  };

  // Create demo users with hashed passwords
  const users = await Promise.all(
    Object.values(DEMO_USERS).map(async (user) => {
      return prisma.user.create({
        data: {
          email: user.email,
          password: await hashPassword(user.password),
          name: user.name,
        },
      });
    })
  );

  const [alice, bob, charlie, diana, evan, fiona, george, henry] = users;

  console.log(`👥 Created ${users.length} users`);

  // Create profiles with diverse preferences
  const profiles = await Promise.all([
    prisma.profile.create({
      data: {
        userId: alice.id,
        bio: 'Movie buff who loves psychological thrillers and indie films. Always looking for hidden gems!',
        preferences: { 
          theme: 'dark', 
          language: 'en', 
          notifications: true,
          favoriteGenres: ['Thriller', 'Drama', 'Indie'],
          streamingServices: ['Netflix', 'HBO Max', 'Mubi']
        },
      },
    }),
    prisma.profile.create({
      data: {
        userId: bob.id,
        bio: 'Sci-fi enthusiast and tech lover. Star Wars is life, but I also enjoy thoughtful documentaries.',
        preferences: { 
          theme: 'light', 
          language: 'en', 
          notifications: false,
          favoriteGenres: ['Science Fiction', 'Documentary', 'Action'],
          streamingServices: ['Disney+', 'Amazon Prime', 'Apple TV+']
        },
      },
    }),
    prisma.profile.create({
      data: {
        userId: charlie.id,
        bio: 'Documentary lover and history buff. Learning something new with every film I watch.',
        preferences: { 
          theme: 'dark', 
          language: 'es', 
          notifications: true,
          favoriteGenres: ['Documentary', 'History', 'Biography'],
          streamingServices: ['Netflix', 'CuriosityStream', 'Hulu']
        },
      },
    }),
    prisma.profile.create({
      data: {
        userId: diana.id,
        bio: 'Family movie night organizer. Love finding films that everyone from kids to adults can enjoy.',
        preferences: { 
          theme: 'light', 
          language: 'en', 
          notifications: true,
          favoriteGenres: ['Family', 'Animation', 'Comedy'],
          streamingServices: ['Disney+', 'Netflix', 'Amazon Prime']
        },
      },
    }),
    prisma.profile.create({
      data: {
        userId: evan.id,
        bio: 'Classic film aficionado. If it\'s black and white or from the 70s, I\'ve probably seen it.',
        preferences: { 
          theme: 'dark', 
          language: 'en', 
          notifications: false,
          favoriteGenres: ['Classic', 'Drama', 'Film Noir'],
          streamingServices: ['Criterion Channel', 'HBO Max', 'TCM']
        },
      },
    }),
    prisma.profile.create({
      data: {
        userId: fiona.id,
        bio: 'International cinema explorer. Always searching for the best foreign films and world cinema.',
        preferences: { 
          theme: 'light', 
          language: 'en', 
          notifications: true,
          favoriteGenres: ['Foreign', 'Art House', 'Drama'],
          streamingServices: ['Mubi', 'Netflix', 'Hulu']
        },
      },
    }),
    prisma.profile.create({
      data: {
        userId: george.id,
        bio: 'I love cartoons and superhero movies! Spider-Man is my favorite.',
        preferences: { 
          theme: 'light', 
          language: 'en', 
          notifications: false,
          favoriteGenres: ['Animation', 'Superhero', 'Adventure'],
          streamingServices: ['Disney+', 'Netflix']
        },
      },
    }),
    prisma.profile.create({
      data: {
        userId: henry.id,
        bio: 'Teen who\'s into gaming, anime, and action movies. Always looking for the next binge-worthy series.',
        preferences: { 
          theme: 'dark', 
          language: 'en', 
          notifications: true,
          favoriteGenres: ['Action', 'Anime', 'Teen Drama'],
          streamingServices: ['Netflix', 'Crunchyroll', 'Hulu']
        },
      },
    }),
  ]);

  console.log(`📝 Created ${profiles.length} profiles`);

  // Create diverse media items
  const mediaItems = await Promise.all([
    // Movies
    prisma.mediaItem.create({
      data: {
        tmdbId: 550,
        tmdbType: 'movie',
        title: 'Fight Club',
        description: 'An insomniac office worker and a devil-may-care soapmaker form an underground fight club that evolves into something much, much more.',
        posterPath: '/p64JHd3bGjH8qSEp0gyS1BFrP4V.jpg',
        backdropPath: '/a0JqB5VHx7q0D8dj4qcpFSMiR8e.jpg',
        releaseDate: new Date('1999-10-15'),
        rating: 8.8,
        genres: ['Drama', 'Thriller'],
        creators: ['David Fincher'],
      },
    }),
    prisma.mediaItem.create({
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
    }),
    prisma.mediaItem.create({
      data: {
        tmdbId: 13,
        tmdbType: 'movie',
        title: 'Forrest Gump',
        description: 'The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man with an IQ of 75.',
        posterPath: '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
        backdropPath: '/s3ENxRE5yfkv18h7VYe1rW2cfrP.jpg',
        releaseDate: new Date('1994-07-06'),
        rating: 8.8,
        genres: ['Comedy', 'Drama', 'Romance'],
        creators: ['Robert Zemeckis'],
      },
    }),
    prisma.mediaItem.create({
      data: {
        tmdbId: 157336,
        tmdbType: 'movie',
        title: 'Interstellar',
        description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
        posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        backdropPath: '/nGFRfTuGljHBbssp2fq1uz9nJCX.jpg',
        releaseDate: new Date('2014-11-07'),
        rating: 8.6,
        genres: ['Adventure', 'Drama', 'Science Fiction'],
        creators: ['Christopher Nolan'],
      },
    }),
    prisma.mediaItem.create({
      data: {
        tmdbId: 10138,
        tmdbType: 'movie',
        title: 'Iron Man',
        description: 'After being held captive in an Afghan cave, billionaire engineer Tony Stark creates a unique weaponized suit of armor to fight evil.',
        posterPath: '/78lPtwv72eTNqFW9COBYI0dWDJa.jpg',
        backdropPath: '/sfM6JPQUSokBJsJ5IePX1OJgE4u.jpg',
        releaseDate: new Date('2008-05-02'),
        rating: 7.9,
        genres: ['Action', 'Adventure', 'Science Fiction'],
        creators: ['Jon Favreau'],
      },
    }),
    prisma.mediaItem.create({
      data: {
        tmdbId: 10251,
        tmdbType: 'movie',
        title: 'Toy Story',
        description: 'A cowboy doll is profoundly threatened and jealous when a new spaceman figure replaces him as the favorite toy.',
        posterPath: '/uXDfJxPcso5HLFiZkZKvL1S7a1Z.jpg',
        backdropPath: '/9FBwtxXeTl981MiCj7P9TaoEr9D.jpg',
        releaseDate: new Date('1995-11-22'),
        rating: 8.3,
        genres: ['Animation', 'Comedy', 'Family'],
        creators: ['John Lasseter'],
      },
    }),
    // TV Shows
    prisma.mediaItem.create({
      data: {
        tmdbId: 1399,
        tmdbType: 'tv',
        title: 'Breaking Bad',
        description: 'A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family\'s future.',
        posterPath: '/ggFHVNvVYapdOayUS6XRRtSaZc4.jpg',
        backdropPath: '/x2GZyKXw32edranZgzFnWKwgKSe.jpg',
        releaseDate: new Date('2008-01-20'),
        rating: 9.5,
        genres: ['Crime', 'Drama', 'Thriller'],
        creators: ['Vince Gilligan'],
      },
    }),
    prisma.mediaItem.create({
      data: {
        tmdbId: 82856,
        tmdbType: 'tv',
        title: 'The Mandalorian',
        description: 'The travels of a lone bounty hunter in the outer reaches of the galaxy, far from the authority of the New Republic.',
        posterPath: '/BbNvKCuEF4jSu4QJwQH5V0VI3zB.jpg',
        backdropPath: '/9IJtApU1XrNHnqU8y1cOr0toUtX.jpg',
        releaseDate: new Date('2019-11-12'),
        rating: 8.7,
        genres: ['Action', 'Adventure', 'Science Fiction'],
        creators: ['Jon Favreau'],
      },
    }),
    prisma.mediaItem.create({
      data: {
        tmdbId: 456,
        tmdbType: 'tv',
        title: 'The Simpsons',
        description: 'The satiric adventures of a working-class family in the misfit city of Springfield.',
        posterPath: '/yTZQkSsxmJvg42j31sGnuaqwX9x.jpg',
        backdropPath: '/4caA2t2k1B1t6CiJiKMV6b2dngc.jpg',
        releaseDate: new Date('1989-12-17'),
        rating: 8.7,
        genres: ['Animation', 'Comedy'],
        creators: ['Matt Groening'],
      },
    }),
    prisma.mediaItem.create({
      data: {
        tmdbId: 60059,
        tmdbType: 'tv',
        title: 'Attack on Titan',
        description: 'After his hometown is destroyed and his mother is killed, young Eren Jaeger vows to cleanse the earth of the giant humanoid Titans that have brought humanity to the brink of extinction.',
        posterPath: '/t21oY6aEWJg5r5WvHSbPjK5bTxc.jpg',
        backdropPath: '/zBOi8U5qks6b2t7c5gLp5a1t3Q.jpg',
        releaseDate: new Date('2013-04-07'),
        rating: 9.0,
        genres: ['Action', 'Animation', 'Drama'],
        creators: ['Tetsuro Araki'],
      },
    }),
  ]);

  console.log(`🎬 Created ${mediaItems.length} media items`);

  // Create streaming providers for media items
  const streamingProviders = await Promise.all([
    // Fight Club
    prisma.streamingProvider.create({
      data: {
        mediaItemId: mediaItems[0].id,
        provider: 'netflix',
        regions: ['US', 'CA', 'GB', 'DE'],
      },
    }),
    // Shawshank Redemption
    prisma.streamingProvider.create({
      data: {
        mediaItemId: mediaItems[1].id,
        provider: 'prime_video',
        regions: ['US', 'CA', 'GB'],
      },
    }),
    // Forrest Gump
    prisma.streamingProvider.create({
      data: {
        mediaItemId: mediaItems[2].id,
        provider: 'paramount_plus',
        regions: ['US', 'CA'],
      },
    }),
    // Interstellar
    prisma.streamingProvider.create({
      data: {
        mediaItemId: mediaItems[3].id,
        provider: 'hbo_max',
        regions: ['US', 'CA'],
      },
    }),
    prisma.streamingProvider.create({
      data: {
        mediaItemId: mediaItems[3].id,
        provider: 'prime_video',
        regions: ['GB', 'DE', 'FR'],
      },
    }),
    // Iron Man
    prisma.streamingProvider.create({
      data: {
        mediaItemId: mediaItems[4].id,
        provider: 'disney_plus',
        regions: ['US', 'CA', 'GB', 'DE', 'FR'],
      },
    }),
    // Toy Story
    prisma.streamingProvider.create({
      data: {
        mediaItemId: mediaItems[5].id,
        provider: 'disney_plus',
        regions: ['US', 'CA', 'GB', 'DE', 'FR'],
      },
    }),
    // Breaking Bad
    prisma.streamingProvider.create({
      data: {
        mediaItemId: mediaItems[6].id,
        provider: 'netflix',
        regions: ['US', 'CA', 'GB', 'DE', 'FR'],
      },
    }),
    // The Mandalorian
    prisma.streamingProvider.create({
      data: {
        mediaItemId: mediaItems[7].id,
        provider: 'disney_plus',
        regions: ['US', 'CA', 'GB', 'DE', 'FR'],
      },
    }),
    // The Simpsons
    prisma.streamingProvider.create({
      data: {
        mediaItemId: mediaItems[8].id,
        provider: 'disney_plus',
        regions: ['US', 'CA', 'GB'],
      },
    }),
    prisma.streamingProvider.create({
      data: {
        mediaItemId: mediaItems[8].id,
        provider: 'hulu',
        regions: ['US'],
      },
    }),
    // Attack on Titan
    prisma.streamingProvider.create({
      data: {
        mediaItemId: mediaItems[9].id,
        provider: 'crunchyroll',
        regions: ['US', 'CA', 'GB', 'DE', 'FR'],
      },
    }),
    prisma.streamingProvider.create({
      data: {
        mediaItemId: mediaItems[9].id,
        provider: 'netflix',
        regions: ['US', 'CA'],
      },
    }),
  ]);

  console.log(`📺 Created ${streamingProviders.length} streaming provider entries`);

  // Create diverse watchlist entries
  const watchlistEntries = await Promise.all([
    // Alice's watchlist (thriller enthusiast)
    prisma.watchlistEntry.create({
      data: {
        userId: alice.id,
        mediaItemId: mediaItems[0].id, // Fight Club
        status: 'completed',
        rating: 9,
        notes: 'Mind-bending masterpiece! The twist ending still gets me every time. Fincher at his best.',
        watchedAt: new Date('2024-01-15'),
      },
    }),
    prisma.watchlistEntry.create({
      data: {
        userId: alice.id,
        mediaItemId: mediaItems[6].id, // Breaking Bad
        status: 'watching',
        notes: 'Currently on Season 4. The tension is unreal! Walter White\'s transformation is fascinating.',
        progress: 'S4E8',
      },
    }),
    prisma.watchlistEntry.create({
      data: {
        userId: alice.id,
        mediaItemId: mediaItems[3].id, // Interstellar
        status: 'not_watched',
        notes: 'Heard amazing things about the science and emotional depth. Saving for a weekend movie night.',
      },
    }),
    // Bob's watchlist (sci-fi fan)
    prisma.watchlistEntry.create({
      data: {
        userId: bob.id,
        mediaItemId: mediaItems[3].id, // Interstellar
        status: 'completed',
        rating: 10,
        notes: 'Absolutely brilliant! The science is mostly accurate and the father-daughter story made me cry. Nolan is a genius.',
        watchedAt: new Date('2024-01-20'),
      },
    }),
    prisma.watchlistEntry.create({
      data: {
        userId: bob.id,
        mediaItemId: mediaItems[6].id, // Breaking Bad
        status: 'completed',
        rating: 10,
        notes: 'Best TV series ever made. Perfect writing, acting, and character development.',
        watchedAt: new Date('2023-12-10'),
      },
    }),
    prisma.watchlistEntry.create({
      data: {
        userId: bob.id,
        mediaItemId: mediaItems[7].id, // The Mandalorian
        status: 'watching',
        notes: 'Love the Star Wars vibes! Baby Yoda is adorable. Just finished Season 2.',
        progress: 'S2E8',
      },
    }),
    // Charlie's watchlist (documentary lover)
    prisma.watchlistEntry.create({
      data: {
        userId: charlie.id,
        mediaItemId: mediaItems[1].id, // Shawshank Redemption
        status: 'completed',
        rating: 9,
        notes: 'A powerful story of hope and friendship. Morgan Freeman\'s narration is perfect.',
        watchedAt: new Date('2024-01-05'),
      },
    }),
    prisma.watchlistEntry.create({
      data: {
        userId: charlie.id,
        mediaItemId: mediaItems[2].id, // Forrest Gump
        status: 'completed',
        rating: 8,
        notes: 'Interesting historical perspective, though some parts feel a bit sentimental.',
        watchedAt: new Date('2023-11-20'),
      },
    }),
    // Diana's watchlist (family oriented)
    prisma.watchlistEntry.create({
      data: {
        userId: diana.id,
        mediaItemId: mediaItems[5].id, // Toy Story
        status: 'completed',
        rating: 9,
        notes: 'Perfect family movie! The kids loved it, and the adults enjoyed the clever humor.',
        watchedAt: new Date('2024-01-25'),
      },
    }),
    prisma.watchlistEntry.create({
      data: {
        userId: diana.id,
        mediaItemId: mediaItems[7].id, // The Mandalorian
        status: 'watching',
        notes: 'Great for family viewing! Not too violent, exciting storylines.',
        progress: 'S1E3',
      },
    }),
    prisma.watchlistEntry.create({
      data: {
        userId: diana.id,
        mediaItemId: mediaItems[8].id, // The Simpsons
        status: 'completed',
        rating: 7,
        notes: 'Classic show! Some episodes are hit-or-miss, but the golden seasons are brilliant.',
        watchedAt: new Date('2023-12-15'),
      },
    }),
    // Evan's watchlist (classic film buff)
    prisma.watchlistEntry.create({
      data: {
        userId: evan.id,
        mediaItemId: mediaItems[1].id, // Shawshank Redemption
        status: 'completed',
        rating: 10,
        notes: 'Modern classic that will stand the test of time. Every scene is perfectly crafted.',
        watchedAt: new Date('2024-01-10'),
      },
    }),
    prisma.watchlistEntry.create({
      data: {
        userId: evan.id,
        mediaItemId: mediaItems[2].id, // Forrest Gump
        status: 'completed',
        rating: 8,
        notes: 'Good film, though a bit overrated in my opinion. Tom Hanks is excellent though.',
        watchedAt: new Date('2023-10-15'),
      },
    }),
    // Fiona's watchlist (international cinema)
    prisma.watchlistEntry.create({
      data: {
        userId: fiona.id,
        mediaItemId: mediaItems[9].id, // Attack on Titan
        status: 'watching',
        notes: 'Intense storytelling and animation! The themes about war and humanity are profound.',
        progress: 'S3E5',
      },
    }),
    prisma.watchlistEntry.create({
      data: {
        userId: fiona.id,
        mediaItemId: mediaItems[0].id, // Fight Club
        status: 'not_watched',
        notes: 'Heard this is a critique of consumer culture. Interested in the subtext.',
      },
    }),
    // George's watchlist (kid-friendly)
    prisma.watchlistEntry.create({
      data: {
        userId: george.id,
        mediaItemId: mediaItems[5].id, // Toy Story
        status: 'completed',
        rating: 10,
        notes: 'Buzz Lightyear is my favorite! "To infinity and beyond!"',
        watchedAt: new Date('2024-01-28'),
      },
    }),
    prisma.watchlistEntry.create({
      data: {
        userId: george.id,
        mediaItemId: mediaItems[4].id, // Iron Man
        status: 'completed',
        rating: 9,
        notes: 'Iron Man is so cool! The suit is awesome and he\'s funny.',
        watchedAt: new Date('2024-01-20'),
      },
    }),
    prisma.watchlistEntry.create({
      data: {
        userId: george.id,
        mediaItemId: mediaItems[8].id, // The Simpsons
        status: 'watching',
        notes: 'Bart is so funny! Mom and dad watch with me.',
        progress: 'Various episodes',
      },
    }),
    // Henry's watchlist (teen)
    prisma.watchlistEntry.create({
      data: {
        userId: henry.id,
        mediaItemId: mediaItems[9].id, // Attack on Titan
        status: 'completed',
        rating: 10,
        notes: 'BEST ANIME EVER! The action scenes are insane and the story is dark and deep.',
        watchedAt: new Date('2024-01-22'),
      },
    }),
    prisma.watchlistEntry.create({
      data: {
        userId: henry.id,
        mediaItemId: mediaItems[6].id, // Breaking Bad
        status: 'watching',
        notes: 'Everyone says this is the best show ever. Just started Season 1.',
        progress: 'S1E4',
      },
    }),
    prisma.watchlistEntry.create({
      data: {
        userId: henry.id,
        mediaItemId: mediaItems[4].id, // Iron Man
        status: 'completed',
        rating: 8,
        notes: 'Started the MCU here. Robert Downey Jr. is perfect as Tony Stark.',
        watchedAt: new Date('2023-12-25'),
      },
    }),
  ]);

  console.log(`📝 Created ${watchlistEntries.length} watchlist entries`);

  // Create families with different themes
  const families = await Promise.all([
    // Film Enthusiasts Family
    prisma.family.create({
      data: {
        name: 'Cinema Scholars',
        description: 'Serious film lovers who appreciate the art of filmmaking',
        createdBy: alice.id,
      },
    }),
    // Family Fun Family
    prisma.family.create({
      data: {
        name: 'Family Movie Night',
        description: 'The Martinez-Wilson family\'s movie watching group',
        createdBy: diana.id,
      },
    }),
    // Sci-Fi & Fantasy Family
    prisma.family.create({
      data: {
        name: 'Sci-Fi Explorers',
        description: 'Exploring new worlds and futuristic stories together',
        createdBy: bob.id,
      },
    }),
    // International Cinema Family
    prisma.family.create({
      data: {
        name: 'World Cinema Club',
        description: 'Discovering films from around the globe',
        createdBy: fiona.id,
      },
    }),
  ]);

  const [cinemaScholars, familyMovieNight, sciFiExplorers, worldCinema] = families;

  console.log(`👨‍👩‍👧‍👦 Created ${families.length} families`);

  // Add family memberships
  const familyMemberships = await Promise.all([
    // Cinema Scholars: Alice, Evan, Charlie
    prisma.familyMembership.create({
      data: { userId: alice.id, familyId: cinemaScholars.id, role: 'owner' },
    }),
    prisma.familyMembership.create({
      data: { userId: evan.id, familyId: cinemaScholars.id, role: 'admin' },
    }),
    prisma.familyMembership.create({
      data: { userId: charlie.id, familyId: cinemaScholars.id, role: 'member' },
    }),
    // Family Movie Night: Diana (owner), George, Henry
    prisma.familyMembership.create({
      data: { userId: diana.id, familyId: familyMovieNight.id, role: 'owner' },
    }),
    prisma.familyMembership.create({
      data: { userId: george.id, familyId: familyMovieNight.id, role: 'member' },
    }),
    prisma.familyMembership.create({
      data: { userId: henry.id, familyId: familyMovieNight.id, role: 'member' },
    }),
    // Sci-Fi Explorers: Bob (owner), Alice, Henry
    prisma.familyMembership.create({
      data: { userId: bob.id, familyId: sciFiExplorers.id, role: 'owner' },
    }),
    prisma.familyMembership.create({
      data: { userId: alice.id, familyId: sciFiExplorers.id, role: 'member' },
    }),
    prisma.familyMembership.create({
      data: { userId: henry.id, familyId: sciFiExplorers.id, role: 'member' },
    }),
    // World Cinema: Fiona (owner), Charlie, Bob
    prisma.familyMembership.create({
      data: { userId: fiona.id, familyId: worldCinema.id, role: 'owner' },
    }),
    prisma.familyMembership.create({
      data: { userId: charlie.id, familyId: worldCinema.id, role: 'member' },
    }),
    prisma.familyMembership.create({
      data: { userId: bob.id, familyId: worldCinema.id, role: 'member' },
    }),
  ]);

  console.log(`👥 Created ${familyMemberships.length} family memberships`);

  // Create family invitations
  const invitations = await Promise.all([
    // Invite Evan to Family Movie Night (kid-friendly content)
    prisma.familyInvitation.create({
      data: {
        familyId: familyMovieNight.id,
        email: 'evan@example.com',
        token: 'invite_family_movie_night_' + Math.random().toString(36).substring(7),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        invitedBy: diana.id,
      },
    }),
    // Invite Fiona to Cinema Scholars
    prisma.familyInvitation.create({
      data: {
        familyId: cinemaScholars.id,
        email: 'fiona@example.com',
        token: 'invite_cinema_scholars_' + Math.random().toString(36).substring(7),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        invitedBy: alice.id,
      },
    }),
    // Invite George to Sci-Fi Explorers
    prisma.familyInvitation.create({
      data: {
        familyId: sciFiExplorers.id,
        email: 'george@example.com',
        token: 'invite_sci_fi_' + Math.random().toString(36).substring(7),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        invitedBy: bob.id,
      },
    }),
  ]);

  console.log(`📧 Created ${invitations.length} family invitations`);

  // Create recommendations between users
  const recommendations = await Promise.all([
    // Alice recommends Fight Club to Bob
    prisma.recommendation.create({
      data: {
        mediaItemId: mediaItems[0].id, // Fight Club
        recommendedBy: alice.id,
        recommendedTo: bob.id,
        message: 'You\'ll love the psychological depth and social commentary. One of Fincher\'s best works!',
        status: 'pending',
      },
    }),
    // Bob recommends Interstellar to Alice
    prisma.recommendation.create({
      data: {
        mediaItemId: mediaItems[3].id, // Interstellar
        recommendedBy: bob.id,
        recommendedTo: alice.id,
        message: 'Perfect blend of hard science fiction and emotional storytelling. The black hole scenes are stunning!',
        status: 'accepted',
      },
    }),
    // Diana recommends Toy Story to George (already seen, but recommendation)
    prisma.recommendation.create({
      data: {
        mediaItemId: mediaItems[5].id, // Toy Story
        recommendedBy: diana.id,
        recommendedTo: george.id,
        message: 'Since you loved Iron Man, you should watch the movie that started Pixar\'s legacy!',
        status: 'accepted',
      },
    }),
    // Henry recommends Attack on Titan to Bob
    prisma.recommendation.create({
      data: {
        mediaItemId: mediaItems[9].id, // Attack on Titan
        recommendedBy: henry.id,
        recommendedTo: bob.id,
        message: 'I know you like sci-fi, and this anime has incredible world-building and moral complexity.',
        status: 'pending',
      },
    }),
    // Fiona recommends Attack on Titan to Charlie
    prisma.recommendation.create({
      data: {
        mediaItemId: mediaItems[9].id, // Attack on Titan
        recommendedBy: fiona.id,
        recommendedTo: charlie.id,
        message: 'It\'s not just action - it\'s a profound exploration of war, freedom, and human nature. Beautiful animation too.',
        status: 'pending',
      },
    }),
    // Evan recommends Shawshank Redemption to Fiona
    prisma.recommendation.create({
      data: {
        mediaItemId: mediaItems[1].id, // Shawshank Redemption
        recommendedBy: evan.id,
        recommendedTo: fiona.id,
        message: 'A modern American masterpiece. The storytelling and cinematography are exceptional.',
        status: 'pending',
      },
    }),
  ]);

  console.log(`💡 Created ${recommendations.length} recommendations`);

  // Create sessions for demo users
  const sessions = await Promise.all([
    prisma.session.create({
      data: {
        userId: alice.id,
        token: 'demo_session_alice_' + Math.random().toString(36).substring(7),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    }),
    prisma.session.create({
      data: {
        userId: bob.id,
        token: 'demo_session_bob_' + Math.random().toString(36).substring(7),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    }),
    prisma.session.create({
      data: {
        userId: diana.id,
        token: 'demo_session_diana_' + Math.random().toString(36).substring(7),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log(`🔐 Created ${sessions.length} active sessions`);

  // Create refresh tokens
  const refreshTokens = await Promise.all([
    prisma.refreshToken.create({
      data: {
        userId: alice.id,
        token: 'demo_refresh_alice_' + Math.random().toString(36).substring(7),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    }),
    prisma.refreshToken.create({
      data: {
        userId: bob.id,
        token: 'demo_refresh_bob_' + Math.random().toString(36).substring(7),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.refreshToken.create({
      data: {
        userId: diana.id,
        token: 'demo_refresh_diana_' + Math.random().toString(36).substring(7),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log(`🔄 Created ${refreshTokens.length} refresh tokens`);

  console.log('\n✅ Enhanced seed completed successfully!');
  console.log('\n📊 Demo Data Summary:');
  console.log(`👥 Users: ${users.length}`);
  console.log(`📝 Profiles: ${profiles.length}`);
  console.log(`🎬 Media Items: ${mediaItems.length}`);
  console.log(`📺 Streaming Providers: ${streamingProviders.length}`);
  console.log(`📋 Watchlist Entries: ${watchlistEntries.length}`);
  console.log(`👨‍👩‍👧‍👦 Families: ${families.length}`);
  console.log(`👥 Family Memberships: ${familyMemberships.length}`);
  console.log(`📧 Family Invitations: ${invitations.length}`);
  console.log(`💡 Recommendations: ${recommendations.length}`);
  console.log(`🔐 Sessions: ${sessions.length}`);
  console.log(`🔄 Refresh Tokens: ${refreshTokens.length}`);

  console.log('\n🔑 Demo User Credentials:');
  Object.values(DEMO_USERS).forEach((user) => {
    console.log(`   ${user.name}: ${user.email} / password123`);
  });

  console.log('\n🎭 Family Themes:');
  console.log('   Cinema Scholars - Serious film discussions and classic cinema');
  console.log('   Family Movie Night - Kid-friendly content for all ages');
  console.log('   Sci-Fi Explorers - Science fiction and fantasy exploration');
  console.log('   World Cinema Club - International films and diverse perspectives');

  console.log('\n📱 Import/Export Ready Data:');
  console.log('   All watchlist entries include detailed notes and ratings');
  console.log('   Streaming provider information for multiple regions');
  console.log('   Diverse watch statuses and progress tracking');
  console.log('   Rich user profiles with preferences and viewing history');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });