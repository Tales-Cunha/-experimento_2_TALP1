module.exports = {
  default: {
    paths: ["tests/features/**/*.feature"],
    requireModule: ["ts-node/register"],
    require: ["tests/steps/**/*.steps.ts", "tests/support/**/*.ts"],
    format: ["summary"]
  }
};
