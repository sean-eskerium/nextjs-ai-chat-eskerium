import { render, screen } from '@testing-library/react'
import { PreviewMessage } from '../../components/message'
import { TooltipProvider } from '../../components/ui/tooltip'

describe('Message Component', () => {
  it('renders user message', () => {
    render(
      <TooltipProvider>
        <PreviewMessage
          chatId="123"
          message={{ role: 'user', content: 'Hello world', id: '1' }}
          vote={undefined}
          isLoading={false}
          setMessages={() => {}}
          reload={() => Promise.resolve(null)}
          isReadonly={false}
        />
      </TooltipProvider>
    )
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })
}) 