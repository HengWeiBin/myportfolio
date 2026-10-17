import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useNavigationGuard from '../useNavigationGuard';

describe('useNavigationGuard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('immediately executes action when isDirty is false', () => {
    const action = vi.fn();
    const { result } = renderHook(() =>
      useNavigationGuard({ isDirty: false, onSave: vi.fn(), onDiscard: vi.fn() })
    );

    act(() => {
      result.current.requestTransition(action);
    });

    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.isGuardOpen).toBe(false);
  });

  it('buffers action and opens guard modal when isDirty is true', () => {
    const action = vi.fn();
    const { result } = renderHook(() =>
      useNavigationGuard({ isDirty: true, onSave: vi.fn(), onDiscard: vi.fn() })
    );

    act(() => {
      result.current.requestTransition(action);
    });

    expect(action).not.toHaveBeenCalled();
    expect(result.current.isGuardOpen).toBe(true);
  });

  it('handleSaveAndProceed saves, runs pending action, and closes guard', async () => {
    const action = vi.fn();
    const onSave = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() =>
      useNavigationGuard({ isDirty: true, onSave, onDiscard: vi.fn() })
    );

    act(() => {
      result.current.requestTransition(action);
    });
    expect(result.current.isGuardOpen).toBe(true);

    await act(async () => {
      await result.current.handleSaveAndProceed();
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.isGuardOpen).toBe(false);
  });

  it('handleSaveAndProceed does not execute action or close guard if onSave returns false', async () => {
    const action = vi.fn();
    const onSave = vi.fn().mockResolvedValue(false);
    const { result } = renderHook(() =>
      useNavigationGuard({ isDirty: true, onSave, onDiscard: vi.fn() })
    );

    act(() => {
      result.current.requestTransition(action);
    });

    await act(async () => {
      await result.current.handleSaveAndProceed();
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(action).not.toHaveBeenCalled();
    expect(result.current.isGuardOpen).toBe(true);
  });

  it('handleDiscardAndProceed discards, runs pending action, and closes guard', () => {
    const action = vi.fn();
    const onDiscard = vi.fn();
    const { result } = renderHook(() =>
      useNavigationGuard({ isDirty: true, onSave: vi.fn(), onDiscard })
    );

    act(() => {
      result.current.requestTransition(action);
    });

    act(() => {
      result.current.handleDiscardAndProceed();
    });

    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.isGuardOpen).toBe(false);
  });

  it('handleCancel closes guard and aborts pending action', () => {
    const action = vi.fn();
    const { result } = renderHook(() =>
      useNavigationGuard({ isDirty: true, onSave: vi.fn(), onDiscard: vi.fn() })
    );

    act(() => {
      result.current.requestTransition(action);
    });
    expect(result.current.isGuardOpen).toBe(true);

    act(() => {
      result.current.handleCancel();
    });

    expect(action).not.toHaveBeenCalled();
    expect(result.current.isGuardOpen).toBe(false);
  });

  it('attaches beforeunload listener when isDirty is true and removes it when clean or unmounted', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { rerender, unmount } = renderHook(
      ({ isDirty }) => useNavigationGuard({ isDirty, onSave: vi.fn(), onDiscard: vi.fn() }),
      { initialProps: { isDirty: false } }
    );

    expect(addEventListenerSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));

    // Transition to dirty
    rerender({ isDirty: true });
    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    // Dispatch beforeunload event to check preventDefault
    const event = new Event('beforeunload', { cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);
    expect(preventDefaultSpy).toHaveBeenCalled();

    // Transition back to clean
    rerender({ isDirty: false });
    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    // Unmount
    unmount();
  });
});
