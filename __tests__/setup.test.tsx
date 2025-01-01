import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

function HelloWorld() {
  return <h1>Hello, World!</h1>
}

describe('Basic React Testing', () => {
  it('renders hello world', () => {
    render(<HelloWorld />)
    expect(screen.getByText('Hello, World!')).toBeInTheDocument()
  })
}) 