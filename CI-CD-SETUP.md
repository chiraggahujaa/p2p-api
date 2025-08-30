# 🚀 CI/CD Pipeline Setup Guide

## Quick Setup Instructions

Due to GitHub App permissions, the CI/CD workflow files need to be manually placed in the `.github/workflows/` directory. Follow these steps:

### 1. Create the Workflow Directory

```bash
mkdir -p .github/workflows
```

### 2. Move the Workflow File

```bash
mv ci-cd-workflow.yml .github/workflows/ci-cd.yml
```

### 3. Configure Repository Secrets

Go to your repository **Settings → Secrets and variables → Actions** and add these secrets:

#### Required Secrets
| Secret Name | Description | Example |
|-------------|-------------|---------|
| `EMAIL_USERNAME` | SMTP username | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | SMTP app-specific password | `abcd efgh ijkl mnop` |
| `NOTIFICATION_EMAILS` | Comma-separated recipients | `dev@company.com,admin@company.com` |
| `SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIs...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIs...` |

### 4. Create Production Environment

1. Go to **Settings → Environments**
2. Click **New environment**
3. Name it `production`
4. Add protection rules (optional but recommended):
   - Required reviewers
   - Wait timer
   - Deployment branches (restrict to `p2p/prod`)

### 5. Configure Email (Gmail Example)

For Gmail SMTP:
1. Enable 2-Factor Authentication
2. Generate an **App-specific password**:
   - Go to Google Account settings
   - Security → App passwords
   - Generate password for "Mail"
3. Use this app-specific password as `EMAIL_PASSWORD`

### 6. Update Deployment Configuration

Edit the deployment section in `.github/workflows/ci-cd.yml` to match your deployment target:

#### Option A: Railway
```yaml
- name: Deploy to Railway
  run: railway deploy
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

#### Option B: Heroku
```yaml
- name: Deploy to Heroku
  run: |
    heroku container:push web --app ${{ secrets.HEROKU_APP_NAME }}
    heroku container:release web --app ${{ secrets.HEROKU_APP_NAME }}
  env:
    HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
```

#### Option C: AWS CodeDeploy
```yaml
- name: Deploy to AWS
  run: |
    aws deploy create-deployment \
      --application-name p2p-api \
      --deployment-group-name production \
      --s3-location bucket=your-deployment-bucket,key=deployment-package.tar.gz,bundleType=tgz
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    AWS_DEFAULT_REGION: us-east-1
```

## 📋 Workflow Features

### ✅ Quality Assurance
- **ESLint**: `npx eslint . --ext .ts,.tsx`
- **TypeScript**: `tsc --noEmit`
- **Build Test**: Compilation verification
- **Security Audit**: npm vulnerability scanning

### 🚀 Deployment
- **Conditional**: Only triggers on `p2p/prod` branch
- **Environment Protection**: Manual approval for production
- **Artifact Management**: Reuses build artifacts

### 🧪 Testing
- **Cypress E2E**: All test suites run in parallel
- **Test Suites**: auth, users, items, bookings, categories, integration
- **Post-deployment**: Tests run after successful deployment

### 📧 Notifications
- **Email Reports**: HTML emails with test summaries
- **Artifacts**: Screenshots, videos, and reports
- **Real-time**: Workflow status updates

## 🔧 Troubleshooting

### Common Issues

#### 1. Workflow Doesn't Trigger
- Check if the workflow file is in `.github/workflows/`
- Verify the branch name matches your setup
- Ensure the YAML syntax is valid

#### 2. Email Notifications Fail
- Verify SMTP credentials are correct
- Check if 2FA is enabled (use app-specific password)
- Ensure `NOTIFICATION_EMAILS` contains valid addresses

#### 3. Deployment Fails
- Check if all required secrets are set
- Verify deployment credentials
- Review deployment logs in GitHub Actions

#### 4. Tests Fail
- Ensure your application is running and accessible
- Check Cypress configuration in `cypress.config.ts`
- Review test screenshots/videos for debugging

### Validation Commands

```bash
# Validate YAML syntax
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci-cd.yml'))"

# Test ESLint locally
npx eslint . --ext .ts,.tsx

# Test TypeScript compilation
tsc --noEmit

# Test build
npm run build

# Run Cypress tests
npm run test:smoke
```

## 📊 Monitoring

### Workflow Status
- View all runs in the **Actions** tab
- Each job shows detailed logs and timing
- Artifacts are downloadable for 90 days

### Performance Metrics
- **Parallel Jobs**: Quality checks run simultaneously
- **Caching**: Node.js dependencies cached
- **Matrix Strategy**: Tests run in parallel
- **Conditional Execution**: Only runs when needed

### Security
- All secrets masked in logs
- Artifacts auto-cleanup after completion
- Production environment protection
- Vulnerability scanning before deployment

## 🎯 Best Practices

1. **Branch Protection**: Require PR reviews and status checks
2. **Environment Secrets**: Use environment-specific secrets
3. **Monitoring**: Set up application monitoring post-deployment
4. **Rollback**: Have a rollback strategy ready
5. **Documentation**: Keep this guide updated with changes

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review workflow logs in GitHub Actions
3. Validate your configuration against this guide
4. Test individual components locally

The CI/CD pipeline is designed to be robust and provide comprehensive feedback at each stage. All components are production-ready and follow DevOps best practices.