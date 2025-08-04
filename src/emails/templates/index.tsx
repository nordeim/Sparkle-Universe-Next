// src/emails/templates/index.tsx
import React from 'react'
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Link,
  Img,
  Hr,
  Preview,
} from '@react-email/components'

// Base layout component
interface BaseLayoutProps {
  preview: string
  children: React.ReactNode
}

const BaseLayout: React.FC<BaseLayoutProps> = ({ preview, children }) => (
  <Html>
    <Head>
      <style>
        {`
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 400;
            src: url('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2') format('woff2');
          }
          
          * {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
        `}
      </style>
    </Head>
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img
            src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`}
            alt="Sparkle Universe"
            width="150"
            height="50"
          />
        </Section>
        {children}
        <Hr style={hr} />
        <Section style={footer}>
          <Text style={footerText}>
            © 2025 Sparkle Universe. All rights reserved.
          </Text>
          <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`} style={footerLink}>
            Unsubscribe
          </Link>
          {' • '}
          <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/privacy`} style={footerLink}>
            Privacy Policy
          </Link>
        </Section>
      </Container>
    </Body>
  </Html>
)

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  padding: '40px 0',
}

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #eee',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '600px',
  padding: '40px',
}

const header = {
  textAlign: 'center' as const,
  marginBottom: '40px',
}

const heading = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 20px',
}

const text = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 20px',
}

const button = {
  backgroundColor: '#8B5CF6',
  borderRadius: '6px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '12px 24px',
  textDecoration: 'none',
  textAlign: 'center' as const,
}

const hr = {
  borderColor: '#e8e8e8',
  margin: '40px 0 20px',
}

const footer = {
  textAlign: 'center' as const,
}

const footerText = {
  color: '#8a8a8a',
  fontSize: '14px',
  margin: '0 0 10px',
}

const footerLink = {
  color: '#8B5CF6',
  fontSize: '14px',
  textDecoration: 'none',
}

// Welcome Email Template
export const WelcomeEmail = ({ name, username, verificationUrl, profileUrl }: any) => (
  <BaseLayout preview="Welcome to Sparkle Universe! Verify your email to get started.">
    <Section>
      <Text style={heading}>Welcome to Sparkle Universe, {name}! 🎉</Text>
      <Text style={text}>
        We're thrilled to have you join our vibrant community of Sparkle fans!
        Your journey in the Sparkle Universe begins now.
      </Text>
      <Text style={text}>
        To get started, please verify your email address:
      </Text>
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={verificationUrl} style={button}>
          Verify Email Address
        </Button>
      </Section>
      <Text style={text}>
        Here's what you can do next:
      </Text>
      <ul style={{ ...text, paddingLeft: '20px' }}>
        <li>Complete your profile and earn your first achievement</li>
        <li>Follow your favorite creators and topics</li>
        <li>Create your first post and introduce yourself</li>
        <li>Join groups that match your interests</li>
      </ul>
      <Text style={text}>
        Your profile: <Link href={profileUrl}>@{username}</Link>
      </Text>
    </Section>
  </BaseLayout>
)

// Password Reset Email
export const PasswordResetEmail = ({ resetUrl, expiresIn }: any) => (
  <BaseLayout preview="Reset your Sparkle Universe password">
    <Section>
      <Text style={heading}>Reset Your Password</Text>
      <Text style={text}>
        We received a request to reset your password. If you didn't make this request,
        you can safely ignore this email.
      </Text>
      <Text style={text}>
        To reset your password, click the button below:
      </Text>
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={resetUrl} style={button}>
          Reset Password
        </Button>
      </Section>
      <Text style={text}>
        This link will expire in {expiresIn}. If the link has expired,
        you can request a new one from the login page.
      </Text>
      <Text style={{ ...text, fontSize: '14px', color: '#8a8a8a' }}>
        If you're having trouble clicking the button, copy and paste this URL
        into your browser: {resetUrl}
      </Text>
    </Section>
  </BaseLayout>
)

// Verification Email
export const VerificationEmail = ({ code, expiresIn }: any) => (
  <BaseLayout preview="Verify your email address">
    <Section>
      <Text style={heading}>Verify Your Email Address</Text>
      <Text style={text}>
        Enter this verification code to confirm your email address:
      </Text>
      <Section style={{ 
        textAlign: 'center', 
        margin: '32px 0',
        padding: '24px',
        backgroundColor: '#f6f9fc',
        borderRadius: '8px',
      }}>
        <Text style={{ 
          ...heading, 
          fontSize: '32px',
          letterSpacing: '8px',
          color: '#8B5CF6',
        }}>
          {code}
        </Text>
      </Section>
      <Text style={text}>
        This code will expire in {expiresIn}.
      </Text>
    </Section>
  </BaseLayout>
)

// Notification Emails
export const PostLikedEmail = ({ user, notification }: any) => (
  <BaseLayout preview="Someone liked your post!">
    <Section>
      <Text style={heading}>Your post got some love! ❤️</Text>
      <Text style={text}>
        Hi {user.name},
      </Text>
      <Text style={text}>
        {notification.actorName} just liked your post "{notification.postTitle}".
        Your content is resonating with the community!
      </Text>
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={notification.postUrl} style={button}>
          View Your Post
        </Button>
      </Section>
    </Section>
  </BaseLayout>
)

export const CommentNotificationEmail = ({ user, notification }: any) => (
  <BaseLayout preview="New comment on your post">
    <Section>
      <Text style={heading}>New comment on your post 💬</Text>
      <Text style={text}>
        Hi {user.name},
      </Text>
      <Text style={text}>
        {notification.actorName} commented on your post "{notification.postTitle}":
      </Text>
      <Section style={{
        margin: '24px 0',
        padding: '16px',
        backgroundColor: '#f6f9fc',
        borderRadius: '8px',
        borderLeft: '4px solid #8B5CF6',
      }}>
        <Text style={{ ...text, margin: 0 }}>
          "{notification.commentPreview}"
        </Text>
      </Section>
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={notification.commentUrl} style={button}>
          Reply to Comment
        </Button>
      </Section>
    </Section>
  </BaseLayout>
)

export const NewFollowerEmail = ({ user, notification }: any) => (
  <BaseLayout preview="You have a new follower!">
    <Section>
      <Text style={heading}>You have a new follower! 🌟</Text>
      <Text style={text}>
        Hi {user.name},
      </Text>
      <Text style={text}>
        {notification.followerName} is now following you. Check out their profile
        and see if you'd like to follow them back!
      </Text>
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={notification.profileUrl} style={button}>
          View Profile
        </Button>
      </Section>
      <Text style={text}>
        You now have {notification.totalFollowers} followers. Keep creating great content!
      </Text>
    </Section>
  </BaseLayout>
)

export const AchievementEmail = ({ user, notification }: any) => (
  <BaseLayout preview={`Achievement Unlocked: ${notification.achievementName}!`}>
    <Section>
      <Text style={heading}>Achievement Unlocked! 🏆</Text>
      <Text style={text}>
        Congratulations {user.name}!
      </Text>
      <Text style={text}>
        You've unlocked the "{notification.achievementName}" achievement!
      </Text>
      <Section style={{
        textAlign: 'center',
        margin: '32px 0',
      }}>
        <Img
          src={notification.achievementImage}
          alt={notification.achievementName}
          width="120"
          height="120"
        />
      </Section>
      <Text style={text}>
        {notification.achievementDescription}
      </Text>
      <Text style={text}>
        Rewards: +{notification.xpReward} XP, +{notification.pointsReward} Sparkle Points
      </Text>
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={notification.achievementsUrl} style={button}>
          View All Achievements
        </Button>
      </Section>
    </Section>
  </BaseLayout>
)

export const LevelUpEmail = ({ user, notification }: any) => (
  <BaseLayout preview={`Level ${notification.level} Reached!`}>
    <Section>
      <Text style={heading}>Level Up! You're now Level {notification.level}! 🎉</Text>
      <Text style={text}>
        Amazing work, {user.name}!
      </Text>
      <Text style={text}>
        You've reached Level {notification.level} in Sparkle Universe! 
        This is a testament to your dedication and contribution to our community.
      </Text>
      <Text style={text}>
        New perks unlocked:
      </Text>
      <ul style={{ ...text, paddingLeft: '20px' }}>
        {notification.perks.map((perk: string, index: number) => (
          <li key={index}>{perk}</li>
        ))}
      </ul>
      <Text style={text}>
        Bonus reward: +{notification.bonusPoints} Sparkle Points!
      </Text>
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={notification.profileUrl} style={button}>
          View Your Progress
        </Button>
      </Section>
    </Section>
  </BaseLayout>
)

export const WeeklyDigestEmail = ({ name, posts, newFollowers, achievementsUnlocked, week }: any) => (
  <BaseLayout preview="Your weekly Sparkle Universe digest">
    <Section>
      <Text style={heading}>Your Weekly Sparkle Digest ✨</Text>
      <Text style={text}>
        Hi {name},
      </Text>
      <Text style={text}>
        Here's what happened in your Sparkle Universe this week:
      </Text>
      
      <Section style={{ margin: '32px 0' }}>
        <Text style={{ ...heading, fontSize: '20px' }}>📊 Your Stats</Text>
        <ul style={{ ...text, paddingLeft: '20px' }}>
          <li>{newFollowers} new followers</li>
          <li>{achievementsUnlocked} achievements unlocked</li>
        </ul>
      </Section>

      {posts.length > 0 && (
        <Section style={{ margin: '32px 0' }}>
          <Text style={{ ...heading, fontSize: '20px' }}>🔥 Top Posts from People You Follow</Text>
          {posts.map((post: any, index: number) => (
            <Section key={index} style={{
              margin: '16px 0',
              padding: '16px',
              backgroundColor: '#f6f9fc',
              borderRadius: '8px',
            }}>
              <Text style={{ ...text, fontWeight: 'bold', margin: '0 0 8px' }}>
                {post.title}
              </Text>
              <Text style={{ ...text, fontSize: '14px', margin: '0 0 8px' }}>
                by {post.author.username} • {post.likes} likes
              </Text>
              <Link href={post.url} style={{ ...footerLink, fontSize: '14px' }}>
                Read more →
              </Link>
            </Section>
          ))}
        </Section>
      )}

      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={`${process.env.NEXT_PUBLIC_APP_URL}/feed`} style={button}>
          Explore More Content
        </Button>
      </Section>
    </Section>
  </BaseLayout>
)

// System Notification Email (fallback)
export const SystemNotificationEmail = ({ user, notification }: any) => (
  <BaseLayout preview={notification.title}>
    <Section>
      <Text style={heading}>{notification.title}</Text>
      <Text style={text}>
        Hi {user.name},
      </Text>
      <Text style={text}>
        {notification.message}
      </Text>
      {notification.actionUrl && (
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button href={notification.actionUrl} style={button}>
            {notification.actionText || 'View Details'}
          </Button>
        </Section>
      )}
    </Section>
  </BaseLayout>
)

// Add more email templates as needed...
export const MentionEmail = SystemNotificationEmail
export const CommentLikedEmail = SystemNotificationEmail
export const GroupInviteEmail = SystemNotificationEmail
export const GroupPostEmail = SystemNotificationEmail
export const EventReminderEmail = SystemNotificationEmail
export const WatchPartyInviteEmail = SystemNotificationEmail
export const DirectMessageEmail = SystemNotificationEmail
export const YouTubePremiereEmail = SystemNotificationEmail
export const QuestCompleteEmail = SystemNotificationEmail
export const TradeRequestEmail = SystemNotificationEmail
export const ContentFeaturedEmail = SystemNotificationEmail
export const MilestoneEmail = SystemNotificationEmail
