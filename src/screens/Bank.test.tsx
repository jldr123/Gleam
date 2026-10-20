import { fireEvent, render, screen } from '@testing-library/react'
import { useStore } from '../store'
import { entry } from '../test/fixtures'
import { Bank } from './Bank'

describe('the bank', () => {
  it('shows the prompt text stored on the entry, not the current wording', () => {
    const date = useStore.getState().today()
    useStore.setState({
      entries: { [date]: entry(date, ['Clean sheets'], 4, { promptId: 'granted', promptText: 'An older wording of this prompt', promptAnswer: 'Hot water' }) },
    })
    render(<Bank />)
    fireEvent.click(screen.getByText('Clean sheets'))
    expect(screen.getByText('An older wording of this prompt')).toBeInTheDocument()
    expect(screen.queryByText('What small comfort did you have today?')).not.toBeInTheDocument()
  })
})
