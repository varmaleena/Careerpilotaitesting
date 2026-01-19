# Analytics Integration Guide

## ✅ Completed Setup

1. ✅ Installed analytics packages (mixpanel-browser, react-ga4, @vercel/analytics)
2. ✅ Created analytics service (`services/analytics.ts`)
3. ✅ Added environment variables to `.env.local`
4. ✅ Imported analytics into `App.tsx`

---

## 🔑 Next Steps: Get Your Analytics Keys

### 1. Mixpanel (Free Tier - Unlimited Events)

**Sign up**: https://mixpanel.com/register/

1. Create account
2. Create new project "CareerPilot"
3. Copy your **Project Token**
4. Paste into `.env.local` as `VITE_MIXPANEL_TOKEN`

### 2. Google Analytics 4 (Free)

**Sign up**: https://analytics.google.com/

1. Create account
2. Create property "CareerPilot"
3. Create web data stream
4. Copy your **Measurement ID** (starts with G-)
5. Paste into `.env.local` as `VITE_GA_MEASUREMENT_ID`

---

## 📊 Events Being Tracked

### Authentication Events
- ✅ Signup Started
- ✅ Signup Completed
- ✅ Login Completed
- ✅ Logout

### Onboarding Events
- ✅ Resume Uploaded
- ✅ Target Role Selected
- ✅ Onboarding Completed

### Analysis Events
- ✅ Analysis Started
- ✅ Analysis Completed
- ✅ Readiness Score Received

### Learning Plan Events
- ✅ Plan Generation Started
- ✅ Plan Generated
- ✅ Task Completed
- ✅ Task Added/Deleted

### Project Events
- ✅ Projects Generated
- ✅ Project Details Opened
- ✅ Project Copied

### Interview Events
- ✅ Interview Started
- ✅ Interview Message Sent
- ✅ Interview Ended
- ✅ Feedback Viewed

### Job Events
- ✅ Job Scan Started
- ✅ Job Scan Completed
- ✅ Job Viewed

### Resume Events
- ✅ Resume Optimization Started
- ✅ Resume Optimized
- ✅ Resume Downloaded

### Navigation Events
- ✅ Page Views (automatic)
- ✅ View Changes

---

## 📈 User Properties Being Tracked

- Name
- Email
- Target Role
- Experience Level
- Graduation Year
- Target Companies
- Signup Date
- Last Active
- Total Analyses
- Total Plans Generated
- Total Interviews
- Total Projects
- Readiness Score
- Skills Acquired/Missing

---

## 🔍 Where to Add More Tracking

### In App.tsx, add these tracking calls:

```typescript
// After successful signup
analytics.track(EVENTS.SIGNUP_COMPLETED, {
  email: emailInput,
  method: 'email'
});

// After successful login
analytics.track(EVENTS.LOGIN_COMPLETED, {
  email: emailInput
});

// After resume upload
analytics.track(EVENTS.RESUME_UPLOADED, {
  fileSize: file.size,
  fileType: file.type
});

// After analysis complete
analytics.track(EVENTS.ANALYSIS_COMPLETED, {
  targetRole: userProfile.targetRole,
  readinessScore: result.readinessScore,
  skillsCount: result.skills.length
});

// After plan generated
analytics.track(EVENTS.PLAN_GENERATED, {
  targetRole: userProfile.targetRole,
  weeksCount: generatedPlan.length,
  totalTasks: generatedPlan.reduce((sum, week) => sum + week.tasks.length, 0)
});

// After projects generated
analytics.track(EVENTS.PROJECTS_GENERATED, {
  count: standardProjects.length,
  targetRole: userProfile.targetRole
});

// After interview started
analytics.track(EVENTS.INTERVIEW_STARTED, {
  targetRole: userProfile.targetRole
});

// After job scan
analytics.track(EVENTS.JOB_SCAN_COMPLETED, {
  jobsFound: foundJobs.length,
  targetRole: userProfile.targetRole
});
```

---

## 🎯 Key Metrics to Monitor

### Week 1 Targets:
- **Signups**: 20-50
- **Activation Rate**: 50% (users who complete onboarding)
- **Retention (Day 1)**: 30%
- **Feature Usage**: 
  - Resume Analysis: 80% of users
  - Plan Generation: 40% of users
  - Interview Practice: 20% of users

### Conversion Funnel:
1. Landing Page Visit → Signup (Target: 10%)
2. Signup → Resume Upload (Target: 80%)
3. Resume Upload → Analysis Complete (Target: 90%)
4. Analysis → Plan Generated (Target: 50%)
5. Plan → Interview Practice (Target: 30%)

---

## 📊 Mixpanel Dashboards to Create

### 1. Acquisition Dashboard
- Total Signups (daily/weekly)
- Signup Sources
- Conversion Rate (visitor → signup)

### 2. Activation Dashboard
- Onboarding Completion Rate
- Time to First Value (resume analysis)
- Feature Adoption Rates

### 3. Engagement Dashboard
- Daily/Weekly Active Users
- Average Session Duration
- Features Used per Session
- Most Popular Features

### 4. Retention Dashboard
- Day 1, 7, 30 Retention
- Cohort Analysis
- Churn Rate

### 5. Funnel Dashboard
- Signup → Analysis → Plan → Interview
- Drop-off points
- Conversion rates at each step

---

## 🚀 Quick Start After Getting Keys

1. **Get your Mixpanel token** from mixpanel.com
2. **Get your GA Measurement ID** from analytics.google.com
3. **Update `.env.local`** with real tokens
4. **Restart dev server**: `npm run dev`
5. **Test tracking**: 
   - Sign up as a new user
   - Upload resume
   - Generate plan
   - Check Mixpanel dashboard (data appears in ~1 minute)

---

## 🐛 Debugging

### Check if analytics is working:

```typescript
// Open browser console
// You should see logs like:
// ✅ Analytics initialized
// 📊 Event tracked: Signup Completed
// 👤 User identified: user@example.com
// 📄 Page view: DASHBOARD
```

### Common Issues:

1. **No events showing in Mixpanel**
   - Check token is correct
   - Check browser console for errors
   - Disable ad blockers
   - Wait 1-2 minutes for data to appear

2. **Events tracked but no user properties**
   - Make sure `analytics.identify()` is called after login
   - Check user properties are being set

3. **Page views not tracking**
   - Check `analytics.page()` is called on view changes
   - Verify GA Measurement ID is correct

---

## 📱 Additional Analytics (Optional)

### Vercel Analytics (Already included if deployed on Vercel)
```typescript
import { Analytics } from '@vercel/analytics/react';

// Add to App.tsx
<Analytics />
```

### Hotjar (Heatmaps & Session Recordings)
1. Sign up at hotjar.com
2. Add tracking code to index.html
3. View user sessions and heatmaps

---

## 🎓 Learning Resources

- **Mixpanel Docs**: https://docs.mixpanel.com/
- **GA4 Docs**: https://developers.google.com/analytics/devguides/collection/ga4
- **Analytics Best Practices**: https://segment.com/academy/

---

## ✅ Checklist

- [ ] Sign up for Mixpanel
- [ ] Sign up for Google Analytics
- [ ] Add tokens to `.env.local`
- [ ] Restart dev server
- [ ] Test signup flow
- [ ] Check Mixpanel dashboard
- [ ] Create key dashboards in Mixpanel
- [ ] Set up weekly email reports
- [ ] Share dashboard with team

---

**Status**: ✅ Analytics service ready - Just need to add your tokens!

**Next**: Get your Mixpanel and GA tokens, then test the tracking!
