import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InputField, SelectField, TextareaField } from './FormFields';

describe('InputField', () => {
  it('renders with label', () => {
    render(<InputField label="Email" name="email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    render(<InputField label="Email" name="email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<InputField label="Email" name="email" error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('displays hint text', () => {
    render(<InputField label="Email" name="email" hint="Enter your email address" />);
    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
  });

  it('handles user input', async () => {
    const user = userEvent.setup();
    render(<InputField label="Email" name="email" />);

    const input = screen.getByLabelText('Email');
    await user.type(input, 'test@example.com');

    expect(input).toHaveValue('test@example.com');
  });

  it('applies aria-invalid when error exists', () => {
    render(<InputField label="Email" name="email" error="Invalid" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('links error message with aria-describedby', () => {
    render(<InputField label="Email" name="email" error="Invalid email" />);
    const input = screen.getByLabelText('Email');
    const errorId = input.getAttribute('aria-describedby');
    expect(errorId).toBeTruthy();
    expect(screen.getByText('Invalid email').closest('[id]')?.id).toBe(errorId);
  });
});

describe('SelectField', () => {
  const options = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
    { value: 'c', label: 'Option C' },
  ];

  it('renders with label and options', () => {
    render(<SelectField label="Choice" name="choice" options={options} />);
    expect(screen.getByLabelText('Choice')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('shows placeholder option', () => {
    render(<SelectField label="Choice" name="choice" options={options} placeholder="Select one..." />);
    expect(screen.getByText('Select one...')).toBeInTheDocument();
  });

  it('handles selection change', async () => {
    const user = userEvent.setup();
    render(<SelectField label="Choice" name="choice" options={options} />);

    const select = screen.getByLabelText('Choice');
    await user.selectOptions(select, 'b');

    expect(select).toHaveValue('b');
  });

  it('displays error message', () => {
    render(<SelectField label="Choice" name="choice" options={options} error="Required field" />);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });
});

describe('TextareaField', () => {
  it('renders with label', () => {
    render(<TextareaField label="Description" name="description" />);
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('handles user input', async () => {
    const user = userEvent.setup();
    render(<TextareaField label="Description" name="description" />);

    const textarea = screen.getByLabelText('Description');
    await user.type(textarea, 'This is a test description');

    expect(textarea).toHaveValue('This is a test description');
  });

  it('respects rows attribute', () => {
    render(<TextareaField label="Description" name="description" rows={10} />);
    const textarea = screen.getByLabelText('Description');
    expect(textarea).toHaveAttribute('rows', '10');
  });

  it('shows error state', () => {
    render(<TextareaField label="Description" name="description" error="Too short" />);
    expect(screen.getByText('Too short')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toHaveAttribute('aria-invalid', 'true');
  });
});
