const withNextIntl = require('next-intl/plugin')();

const nextConfig = {
    transpilePackages: ["ui"],
    eslint: {
        ignoreDuringBuilds: true,
    },
};

module.exports = withNextIntl(nextConfig);
