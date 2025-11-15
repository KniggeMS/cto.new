'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create((typeof Iterator === 'function' ? Iterator : Object).prototype);
    return (
      (g.next = verb(0)),
      (g['throw'] = verb(1)),
      (g['return'] = verb(2)),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                    ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, '__esModule', { value: true });
var client_1 = require('@prisma/client');
var prisma = new client_1.PrismaClient();
function main() {
  return __awaiter(this, void 0, void 0, function () {
    var user1,
      user2,
      user3,
      profile1,
      profile2,
      profile3,
      movie1,
      movie2,
      tvShow,
      family,
      invitationToken,
      sessionToken,
      refreshToken;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          console.log('Starting seed...');
          // Clean up existing data (in reverse order of dependencies)
          return [4 /*yield*/, prisma.refreshToken.deleteMany()];
        case 1:
          // Clean up existing data (in reverse order of dependencies)
          _a.sent();
          return [4 /*yield*/, prisma.session.deleteMany()];
        case 2:
          _a.sent();
          return [4 /*yield*/, prisma.streamingProvider.deleteMany()];
        case 3:
          _a.sent();
          return [4 /*yield*/, prisma.recommendation.deleteMany()];
        case 4:
          _a.sent();
          return [4 /*yield*/, prisma.familyInvitation.deleteMany()];
        case 5:
          _a.sent();
          return [4 /*yield*/, prisma.familyMembership.deleteMany()];
        case 6:
          _a.sent();
          return [4 /*yield*/, prisma.family.deleteMany()];
        case 7:
          _a.sent();
          return [4 /*yield*/, prisma.watchlistEntry.deleteMany()];
        case 8:
          _a.sent();
          return [4 /*yield*/, prisma.mediaItem.deleteMany()];
        case 9:
          _a.sent();
          return [4 /*yield*/, prisma.profile.deleteMany()];
        case 10:
          _a.sent();
          return [4 /*yield*/, prisma.user.deleteMany()];
        case 11:
          _a.sent();
          return [
            4 /*yield*/,
            prisma.user.create({
              data: {
                email: 'alice@example.com',
                password: 'hashed_password_1', // In production, use bcrypt or similar
                name: 'Alice',
              },
            }),
          ];
        case 12:
          user1 = _a.sent();
          return [
            4 /*yield*/,
            prisma.user.create({
              data: {
                email: 'bob@example.com',
                password: 'hashed_password_2',
                name: 'Bob',
              },
            }),
          ];
        case 13:
          user2 = _a.sent();
          return [
            4 /*yield*/,
            prisma.user.create({
              data: {
                email: 'charlie@example.com',
                password: 'hashed_password_3',
                name: 'Charlie',
              },
            }),
          ];
        case 14:
          user3 = _a.sent();
          return [
            4 /*yield*/,
            prisma.profile.create({
              data: {
                userId: user1.id,
                bio: 'Love movies and TV shows!',
                preferences: { theme: 'dark', language: 'en' },
              },
            }),
          ];
        case 15:
          profile1 = _a.sent();
          return [
            4 /*yield*/,
            prisma.profile.create({
              data: {
                userId: user2.id,
                bio: 'Sci-fi enthusiast',
                preferences: { theme: 'light', language: 'en' },
              },
            }),
          ];
        case 16:
          profile2 = _a.sent();
          return [
            4 /*yield*/,
            prisma.profile.create({
              data: {
                userId: user3.id,
                bio: 'Documentary lover',
                preferences: { theme: 'dark', language: 'es' },
              },
            }),
          ];
        case 17:
          profile3 = _a.sent();
          return [
            4 /*yield*/,
            prisma.mediaItem.create({
              data: {
                tmdbId: 550,
                tmdbType: 'movie',
                title: 'Fight Club',
                description:
                  'An insomniac office worker and a devil-may-care soapmaker form an underground fight club...',
                posterPath: '/p64JHd3bGjH8qSEp0gyS1BFrP4V.jpg',
                backdropPath: '/a0JqB5VHx7q0D8dj4qcpFSMiR8e.jpg',
                releaseDate: new Date('1999-10-15'),
                rating: 8.8,
                genres: ['Drama', 'Thriller'],
                creators: ['David Fincher'],
              },
            }),
          ];
        case 18:
          movie1 = _a.sent();
          return [
            4 /*yield*/,
            prisma.mediaItem.create({
              data: {
                tmdbId: 278,
                tmdbType: 'movie',
                title: 'The Shawshank Redemption',
                description:
                  'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
                posterPath: '/q6y0Go1tsGEsmtpSDb3kxcH9z0o.jpg',
                backdropPath: '/qiP0tFb3gMrW6wysZI2hlBudGVc.jpg',
                releaseDate: new Date('1994-09-23'),
                rating: 9.3,
                genres: ['Drama'],
                creators: ['Frank Darabont'],
              },
            }),
          ];
        case 19:
          movie2 = _a.sent();
          return [
            4 /*yield*/,
            prisma.mediaItem.create({
              data: {
                tmdbId: 1399,
                tmdbType: 'tv',
                title: 'Breaking Bad',
                description:
                  'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing methamphetamine...',
                posterPath: '/ggFHVNvVYapdOayUS6XRRtSaZc4.jpg',
                backdropPath: '/x2GZyKXw32edranZgzFnWKwgKSe.jpg',
                releaseDate: new Date('2008-01-20'),
                rating: 9.5,
                genres: ['Crime', 'Drama', 'Thriller'],
                creators: ['Vince Gilligan'],
              },
            }),
          ];
        case 20:
          tvShow = _a.sent();
          // Create watchlist entries
          return [
            4 /*yield*/,
            prisma.watchlistEntry.create({
              data: {
                userId: user1.id,
                mediaItemId: movie1.id,
                status: 'completed',
                rating: 9,
                notes: 'Amazing movie! Loved the plot twists.',
              },
            }),
          ];
        case 21:
          // Create watchlist entries
          _a.sent();
          return [
            4 /*yield*/,
            prisma.watchlistEntry.create({
              data: {
                userId: user1.id,
                mediaItemId: tvShow.id,
                status: 'watching',
                notes: 'Currently on Season 3',
              },
            }),
          ];
        case 22:
          _a.sent();
          return [
            4 /*yield*/,
            prisma.watchlistEntry.create({
              data: {
                userId: user2.id,
                mediaItemId: movie2.id,
                status: 'not_watched',
              },
            }),
          ];
        case 23:
          _a.sent();
          return [
            4 /*yield*/,
            prisma.watchlistEntry.create({
              data: {
                userId: user2.id,
                mediaItemId: tvShow.id,
                status: 'completed',
                rating: 10,
                notes: 'Best TV series ever!',
              },
            }),
          ];
        case 24:
          _a.sent();
          // Create streaming providers
          return [
            4 /*yield*/,
            prisma.streamingProvider.create({
              data: {
                mediaItemId: movie1.id,
                provider: 'netflix',
                regions: ['US', 'CA', 'GB'],
              },
            }),
          ];
        case 25:
          // Create streaming providers
          _a.sent();
          return [
            4 /*yield*/,
            prisma.streamingProvider.create({
              data: {
                mediaItemId: tvShow.id,
                provider: 'netflix',
                regions: ['US', 'CA', 'GB'],
              },
            }),
          ];
        case 26:
          _a.sent();
          return [
            4 /*yield*/,
            prisma.streamingProvider.create({
              data: {
                mediaItemId: movie2.id,
                provider: 'prime_video',
                regions: ['US', 'CA'],
              },
            }),
          ];
        case 27:
          _a.sent();
          return [
            4 /*yield*/,
            prisma.family.create({
              data: {
                name: 'Movie Lovers',
                createdBy: user1.id,
              },
            }),
          ];
        case 28:
          family = _a.sent();
          // Add family members
          return [
            4 /*yield*/,
            prisma.familyMembership.create({
              data: {
                userId: user1.id,
                familyId: family.id,
                role: 'admin',
              },
            }),
          ];
        case 29:
          // Add family members
          _a.sent();
          return [
            4 /*yield*/,
            prisma.familyMembership.create({
              data: {
                userId: user2.id,
                familyId: family.id,
                role: 'member',
              },
            }),
          ];
        case 30:
          _a.sent();
          invitationToken = Math.random().toString(36).substring(7);
          return [
            4 /*yield*/,
            prisma.familyInvitation.create({
              data: {
                familyId: family.id,
                email: 'david@example.com',
                token: invitationToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
              },
            }),
          ];
        case 31:
          _a.sent();
          // Create recommendation
          return [
            4 /*yield*/,
            prisma.recommendation.create({
              data: {
                mediaItemId: movie1.id,
                recommendedBy: user1.id,
                recommendedTo: user2.id,
                message: 'You must watch this masterpiece!',
                status: 'pending',
              },
            }),
          ];
        case 32:
          // Create recommendation
          _a.sent();
          sessionToken = Math.random().toString(36).substring(7);
          return [
            4 /*yield*/,
            prisma.session.create({
              data: {
                userId: user1.id,
                token: sessionToken,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
              },
            }),
          ];
        case 33:
          _a.sent();
          refreshToken = Math.random().toString(36).substring(7);
          return [
            4 /*yield*/,
            prisma.refreshToken.create({
              data: {
                userId: user1.id,
                token: refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
              },
            }),
          ];
        case 34:
          _a.sent();
          console.log('Seed completed successfully!');
          console.log('Demo data created:');
          console.log(
            '- Users: '.concat(user1.email, ', ').concat(user2.email, ', ').concat(user3.email),
          );
          console.log(
            '- Media items: '
              .concat(movie1.title, ', ')
              .concat(movie2.title, ', ')
              .concat(tvShow.title),
          );
          console.log('- Family: '.concat(family.name));
          return [2 /*return*/];
      }
    });
  });
}
main()
  .then(function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, prisma.$disconnect()];
          case 1:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  })
  .catch(function (e) {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            console.error(e);
            return [4 /*yield*/, prisma.$disconnect()];
          case 1:
            _a.sent();
            process.exit(1);
            return [2 /*return*/];
        }
      });
    });
  });
