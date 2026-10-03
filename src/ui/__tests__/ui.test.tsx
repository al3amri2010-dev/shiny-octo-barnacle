import { fireEvent, render, screen } from '@testing-library/react-native';

import { useGameStore } from '../../state/gameStore';
import { BottomBar } from '../BottomBar';
import { cellLabel } from '../Cell';
import { HelpSheet } from '../HelpSheet';
import { NumberPad } from '../NumberPad';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null, MaterialIcons: () => null }));

describe('NumberPad', () => {
  const base = {
    remaining: [6, 6, 7, 4, 7, 8, 0, 5, 5],
    selectedDigit: null,
    eraseActive: false,
    onDigit: jest.fn(),
    onErase: jest.fn(),
  };

  it('shows the remaining count under each digit', () => {
    render(<NumberPad {...base} />);
    expect(screen.getByTestId('remaining-1').props.children).toBe(6);
    expect(screen.getByTestId('remaining-4').props.children).toBe(4);
    expect(screen.getByTestId('remaining-7').props.children).toBe(0);
  });

  it('disables a digit with none remaining and fires callbacks otherwise', () => {
    const onDigit = jest.fn();
    const onErase = jest.fn();
    render(<NumberPad {...base} onDigit={onDigit} onErase={onErase} />);
    fireEvent.press(screen.getByTestId('key-7'));
    expect(onDigit).not.toHaveBeenCalled();
    expect(screen.getByTestId('key-7').props.accessibilityState.disabled).toBe(true);
    fireEvent.press(screen.getByTestId('key-3'));
    expect(onDigit).toHaveBeenCalledWith(3);
    fireEvent.press(screen.getByTestId('key-X'));
    expect(onErase).toHaveBeenCalled();
  });

  it('marks the selected digit', () => {
    render(<NumberPad {...base} selectedDigit={5} />);
    expect(screen.getByTestId('key-5').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('key-4').props.accessibilityState.selected).toBe(false);
  });
});

describe('HelpSheet', () => {
  it('calls the store action and closes for each button', () => {
    const fns = {
      requestHint: jest.fn(),
      showMismatches: jest.fn(),
      validate: jest.fn(),
      autoNotes: jest.fn(),
    };
    useGameStore.setState(fns);
    const onClose = jest.fn();
    render(<HelpSheet visible onClose={onClose} />);
    expect(
      screen.getByText('Note: Using help transfers your time to a separate leaderboard.'),
    ).toBeTruthy();
    fireEvent.press(screen.getByTestId('help-hint'));
    fireEvent.press(screen.getByTestId('help-mismatches'));
    fireEvent.press(screen.getByTestId('help-validate'));
    fireEvent.press(screen.getByTestId('help-autonotes'));
    expect(fns.requestHint).toHaveBeenCalledTimes(1);
    expect(fns.showMismatches).toHaveBeenCalledTimes(1);
    expect(fns.validate).toHaveBeenCalledTimes(1);
    expect(fns.autoNotes).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(4);
    fireEvent.press(screen.getByTestId('help-close'));
    expect(onClose).toHaveBeenCalledTimes(5);
  });
});

describe('accessibility labels', () => {
  it('describes cells', () => {
    expect(cellLabel(2, 4, 7, true, 0)).toBe('Row 3, column 5, 7, given');
    expect(cellLabel(2, 4, 7, false, 0)).toBe('Row 3, column 5, 7');
    expect(cellLabel(2, 4, 0, false, 0b101)).toBe('Row 3, column 5, empty, notes 1 3');
    expect(cellLabel(0, 0, 0, false, 0)).toBe('Row 1, column 1, empty');
  });

  it('labels pad keys and bottom bar buttons', () => {
    render(
      <>
        <NumberPad
          remaining={[6, 6, 7, 3, 7, 8, 0, 5, 5]}
          selectedDigit={null}
          eraseActive={false}
          onDigit={jest.fn()}
          onErase={jest.fn()}
        />
        <BottomBar
          notesActive={false}
          onRestart={jest.fn()}
          onHelp={jest.fn()}
          onNotes={jest.fn()}
          onUndo={jest.fn()}
        />
      </>,
    );
    expect(screen.getByLabelText('Digit 4, 3 remaining')).toBeTruthy();
    for (const l of ['Restart', 'Help', 'Notes', 'Undo'])
      expect(screen.getByLabelText(l)).toBeTruthy();
  });
});
