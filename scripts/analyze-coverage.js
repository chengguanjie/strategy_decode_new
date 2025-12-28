#!/usr/bin/env node

/**
 * Test Coverage Analysis Script
 *
 * This script analyzes the test coverage report and provides insights
 * about which files need more tests and what the priority areas are.
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Read coverage-summary.json
function readCoverageSummary() {
  const coveragePath = path.join(__dirname, '../coverage/coverage-summary.json');

  if (!fs.existsSync(coveragePath)) {
    console.error(`${colors.red}Error: Coverage report not found!${colors.reset}`);
    console.log(`Please run ${colors.cyan}npm run test:coverage${colors.reset} first.`);
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
}

// Calculate coverage score
function calculateScore(metrics) {
  const { statements, branches, functions, lines } = metrics;
  return (statements.pct + branches.pct + functions.pct + lines.pct) / 4;
}

// Determine coverage level and color
function getCoverageInfo(percentage) {
  if (percentage >= 80) return { level: 'Good', color: colors.green };
  if (percentage >= 60) return { level: 'Fair', color: colors.yellow };
  if (percentage >= 40) return { level: 'Poor', color: colors.magenta };
  return { level: 'Critical', color: colors.red };
}

// Categorize files by importance
function categorizeFiles(coverage) {
  const categories = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  Object.entries(coverage).forEach(([filePath, data]) => {
    if (filePath === 'total') return;

    const score = calculateScore(data);
    const fileInfo = {
      path: filePath,
      score,
      metrics: data,
    };

    // Categorize based on file type and coverage
    if (filePath.includes('/api/') || filePath.includes('/auth')) {
      if (score < 60) categories.critical.push(fileInfo);
      else categories.high.push(fileInfo);
    } else if (filePath.includes('/lib/')) {
      if (score < 60) categories.high.push(fileInfo);
      else categories.medium.push(fileInfo);
    } else if (filePath.includes('/components/')) {
      if (score < 40) categories.medium.push(fileInfo);
      else categories.low.push(fileInfo);
    } else {
      categories.low.push(fileInfo);
    }
  });

  // Sort by score within each category
  Object.keys(categories).forEach(key => {
    categories[key].sort((a, b) => a.score - b.score);
  });

  return categories;
}

// Format file path for display
function formatPath(filePath) {
  return filePath.replace(process.cwd() + '/', '').replace('src/', '');
}

// Generate report
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.cyan}                    TEST COVERAGE ANALYSIS REPORT${colors.reset}`);
  console.log('='.repeat(80) + '\n');

  const coverage = readCoverageSummary();
  const total = coverage.total;

  // Overall Coverage
  console.log(`${colors.blue}📊 Overall Coverage${colors.reset}`);
  console.log('-'.repeat(40));

  const overallScore = calculateScore(total);
  const { level, color } = getCoverageInfo(overallScore);

  console.log(`Overall Score: ${color}${overallScore.toFixed(2)}% - ${level}${colors.reset}\n`);

  console.log(`Statements: ${getCoverageInfo(total.statements.pct).color}${total.statements.pct.toFixed(2)}%${colors.reset} (${total.statements.covered}/${total.statements.total})`);
  console.log(`Branches:   ${getCoverageInfo(total.branches.pct).color}${total.branches.pct.toFixed(2)}%${colors.reset} (${total.branches.covered}/${total.branches.total})`);
  console.log(`Functions:  ${getCoverageInfo(total.functions.pct).color}${total.functions.pct.toFixed(2)}%${colors.reset} (${total.functions.covered}/${total.functions.total})`);
  console.log(`Lines:      ${getCoverageInfo(total.lines.pct).color}${total.lines.pct.toFixed(2)}%${colors.reset} (${total.lines.covered}/${total.lines.total})`);

  // Categorized Files
  const categories = categorizeFiles(coverage);

  // Critical Files (Need immediate attention)
  if (categories.critical.length > 0) {
    console.log(`\n${colors.red}🚨 Critical Priority Files (Need Immediate Testing)${colors.reset}`);
    console.log('-'.repeat(60));
    categories.critical.slice(0, 10).forEach(file => {
      console.log(`${colors.red}⚠${colors.reset}  ${formatPath(file.path)} - Coverage: ${colors.red}${file.score.toFixed(2)}%${colors.reset}`);
    });
  }

  // High Priority Files
  if (categories.high.length > 0) {
    console.log(`\n${colors.yellow}⚡ High Priority Files${colors.reset}`);
    console.log('-'.repeat(60));
    categories.high.slice(0, 10).forEach(file => {
      console.log(`${colors.yellow}!${colors.reset}  ${formatPath(file.path)} - Coverage: ${colors.yellow}${file.score.toFixed(2)}%${colors.reset}`);
    });
  }

  // Summary Statistics
  console.log(`\n${colors.blue}📈 Summary Statistics${colors.reset}`);
  console.log('-'.repeat(40));

  const totalFiles = Object.keys(coverage).length - 1;
  const filesWithGoodCoverage = Object.entries(coverage).filter(([path, data]) =>
    path !== 'total' && calculateScore(data) >= 80
  ).length;
  const filesWithNoCoverage = Object.entries(coverage).filter(([path, data]) =>
    path !== 'total' && calculateScore(data) === 0
  ).length;

  console.log(`Total Files: ${totalFiles}`);
  console.log(`Files with Good Coverage (≥80%): ${colors.green}${filesWithGoodCoverage}${colors.reset}`);
  console.log(`Files with No Coverage: ${colors.red}${filesWithNoCoverage}${colors.reset}`);
  console.log(`Files Needing Attention: ${colors.yellow}${categories.critical.length + categories.high.length}${colors.reset}`);

  // Recommendations
  console.log(`\n${colors.magenta}💡 Recommendations${colors.reset}`);
  console.log('-'.repeat(40));

  if (overallScore < 60) {
    console.log(`1. ${colors.red}Critical:${colors.reset} Overall coverage is below 60%. Focus on testing critical API routes and authentication.`);
  }

  if (categories.critical.length > 0) {
    console.log(`2. Start with critical files in the ${colors.cyan}/api/${colors.reset} and ${colors.cyan}/auth${colors.reset} directories.`);
  }

  if (filesWithNoCoverage > 10) {
    console.log(`3. ${filesWithNoCoverage} files have no tests at all. Consider adding basic tests for each.`);
  }

  console.log(`4. Run ${colors.cyan}npm run test:coverage:html${colors.reset} to see detailed coverage in your browser.`);
  console.log(`5. Use ${colors.cyan}npm run test:watch${colors.reset} for faster test development.`);

  console.log('\n' + '='.repeat(80) + '\n');

  // Exit with error if coverage is too low
  if (overallScore < 60) {
    process.exit(1);
  }
}

// Run the analysis
generateReport();