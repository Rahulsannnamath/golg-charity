import AuthLayout from '../components/auth/AuthLayout'
import AuthForm from '../components/auth/AuthForm'
import '../styles/Auth.css'

function SignupPage() {
  return (
    <AuthLayout
      badge="Split Signup"
      title="Create Your Account and Start Giving"
      subtitle="Join monthly golf draws and route part of every subscription to meaningful causes."
      altText="Already have an account?"
      altLink="/login"
      altLabel="Sign in"
    >
      <AuthForm mode="signup" />
    </AuthLayout>
  )
}

export default SignupPage
