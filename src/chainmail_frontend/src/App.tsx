import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

function App() {
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState<string | null>(null)

  const handleSubmit = () => {
    if (message.trim() !== "") {
      setSubmitted(message)
      setMessage("")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200">
      <Card className="w-[400px] shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">💌 ChainMail Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Write an anonymous letter..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button onClick={handleSubmit} className="w-full">
            Send Letter
          </Button>
          {submitted && (
            <p className="text-sm text-center text-green-700 mt-4">
              ✅ Letter submitted: {submitted}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default App
