// Unit tests use mocked infrastructure, never the review or production database.
process.env.DATABASE_URL ??= 'postgresql://unit:unit@127.0.0.1:9/unit_tests';
process.env.JWT_ACCESS_SECRET ??= 'unit-test-secret-only-never-use-in-a-deployment-123456789';
