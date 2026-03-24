import AuthLayout from '../components/auth/AuthLayout'
import AuthForm from '../components/auth/AuthForm'
import '../styles/Auth.css'

function LoginPage() {
  return (
    <AuthLayout
      badge="Cinematic Login"
      title="Secure Access for Golf Charity Members"
      subtitle="Track scores, check draw status, and manage contributions from one clean dashboard."
      altText="New here?"
      altLink="/signup"
      altLabel="Create account"
    >
      <AuthForm mode="login" />
    </AuthLayout>
  )
}

export default LoginPage
