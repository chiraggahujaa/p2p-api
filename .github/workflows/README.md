# CI/CD Pipeline Documentation

## Overview

This directory contains GitHub Actions workflows for the P2P API project, providing comprehensive continuous integration and deployment automation.

## Workflow: `ci-cd.yml`

### Features

#### Quality Assurance
- **ESLint Check**: Code quality and style validation
- **TypeScript Type Check**: Type safety validation with `tsc --noEmit`
- **Build Test**: Compilation verification and artifact validation
- **Security Audit**: Dependency vulnerability scanning

#### Deployment
- **Conditional Deployment**: Automatic deployment only on `p2p/prod` branch
- **Environment Protection**: Production environment with manual approval gates
- **Artifact Management**: Build artifacts uploaded and reused across jobs

#### Testing
- **Cypress API Tests**: Comprehensive E2E testing post-deployment
- **Parallel Execution**: Matrix strategy for faster test completion
- **Test Suites**: auth, users, items, bookings, categories, integration

#### Notifications
- **Email Reports**: Detailed HTML email with test results
- **Artifact Reports**: Combined markdown reports with test summaries
- **Real-time Updates**: Workflow status updates and notifications

### Configuration Requirements

#### Repository Secrets

Set up these secrets in your GitHub repository settings:

```
EMAIL_USERNAME          # SMTP username (e.g., your Gmail address)
EMAIL_PASSWORD          # SMTP password (use app-specific password for Gmail)
NOTIFICATION_EMAILS     # Comma-separated email addresses for notifications
SUPABASE_URL           # Your Supabase project URL
SUPABASE_ANON_KEY      # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY # Supabase service role key
```

#### Environment Setup

1. **Production Environment**: Create a production environment in GitHub:
   - Go to Repository Settings → Environments
   - Create environment named "production"
   - Add protection rules as needed

2. **Email Configuration**: 
   - For Gmail: Enable 2FA and create an app-specific password
   - For other providers: Configure SMTP settings accordingly

### Deployment Strategy

The workflow supports multiple deployment targets. Update the deployment section in `ci-cd.yml`:

#### AWS CodeDeploy
```yaml
- name: Deploy to AWS
  run: |
    aws deploy create-deployment \
      --application-name p2p-api \
      --deployment-group-name production \
      --s3-location bucket=your-bucket,key=deployment-package.tar.gz,bundleType=tgz
```

#### Railway
```yaml
- name: Deploy to Railway
  run: railway deploy
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

#### Heroku
```yaml
- name: Deploy to Heroku
  run: |
    heroku container:push web --app your-app-name
    heroku container:release web --app your-app-name
  env:
    HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
```

#### Docker Registry
```yaml
- name: Deploy to Container Registry
  run: |
    docker build -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest .
    docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
```

### Workflow Triggers

- **Push**: All branches trigger quality checks
- **Pull Request**: Triggers quality checks for PRs to main/develop
- **Deployment**: Only `p2p/prod` branch pushes trigger deployment
- **Testing**: Post-deployment Cypress tests run after successful deployment

### Job Dependencies

```
lint ──┐
       ├── deploy ──── cypress-tests ──── notify-results
type-check ─┤                                   │
            │                                   ├── cleanup
build-test ─┤                                   │
            │                                   │
security-audit ─┘                              │
                                               │
                                               └─── (cleanup runs always)
```

### Performance Optimizations

- **Caching**: Node.js dependency caching with `actions/setup-node@v4`
- **Parallel Jobs**: Quality assurance jobs run in parallel
- **Matrix Strategy**: Cypress tests run in parallel across test suites
- **Artifact Reuse**: Build artifacts shared between jobs
- **Conditional Execution**: Deployment jobs only run when needed

### Monitoring & Debugging

#### Workflow Status
- View workflow runs in the Actions tab
- Each job provides detailed logs and timing
- Artifacts are available for download after completion

#### Common Issues
1. **ESLint Failures**: Check code quality issues in the ESLint report artifact
2. **TypeScript Errors**: Review type check job logs for compilation errors
3. **Build Failures**: Check build-test job for compilation issues
4. **Test Failures**: Download Cypress screenshots/videos for debugging
5. **Email Notifications**: Verify SMTP credentials and email addresses

#### Debugging Tips
```bash
# Run workflow locally with act (optional)
act -j lint  # Run lint job locally
act -j build-test  # Run build test locally

# Validate workflow syntax
yamllint .github/workflows/ci-cd.yml
```

### Best Practices

1. **Branch Protection**: Enable branch protection rules for main branch
2. **Required Checks**: Make quality assurance jobs required for PR merges
3. **Environment Secrets**: Use environment-specific secrets for sensitive data
4. **Monitoring**: Set up monitoring for your deployed application
5. **Rollback Strategy**: Implement rollback procedures for failed deployments

### Customization

The workflow is designed to be easily customizable:

- **Add Jobs**: Add new jobs to the workflow for additional checks
- **Modify Triggers**: Change trigger conditions based on your branching strategy
- **Test Configuration**: Adjust Cypress test configuration in `cypress.config.ts`
- **Notification**: Customize email templates and notification triggers
- **Deployment**: Replace the deployment section with your preferred deployment method

### Security Considerations

- All secrets are properly masked in logs
- Production environment requires manual approval
- Dependency vulnerabilities are scanned before deployment
- Artifacts are automatically cleaned up to prevent data leakage
- SMTP credentials are stored securely as repository secrets