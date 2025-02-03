import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ErrorMessageProps {
  message: string
  onRetry: () => void
  onModelChange: (agent: string, model: string) => void
  currentModels: { [key: string]: string }
}

export function ErrorMessage({ message, onRetry, onModelChange, currentModels }: ErrorMessageProps) {
  const alternativeModels = ["gpt-4o", "gpt-3.5-turbo", "gpt-4"]

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        <p className="mb-4">{message}</p>
        <p className="mb-2">This error may be due to content flagging. Please try selecting different models:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {Object.entries(currentModels).map(([agent, model]) => (
            <div key={agent} className="flex flex-col space-y-2">
              <label htmlFor={`${agent}-model`} className="text-sm font-medium">
                {agent} Model
              </label>
              <Select value={model} onValueChange={(value) => onModelChange(agent, value)}>
                <SelectTrigger id={`${agent}-model`}>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {alternativeModels.map((altModel) => (
                    <SelectItem key={altModel} value={altModel}>
                      {altModel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <Button onClick={onRetry}>Retry with New Models</Button>
      </AlertDescription>
    </Alert>
  )
}

