import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <SignIn
        appearance={{
          elements: {
            socialButtonsRoot: { display: 'none' },
            socialButtonsBlockButton: { display: 'none' },
            dividerRow: { display: 'none' },
          },
        }}
      />
    </div>
  )
}
