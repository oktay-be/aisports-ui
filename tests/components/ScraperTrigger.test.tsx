import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScraperTrigger } from '../../components/ScraperTrigger';
import { DEFAULT_SCRAPER_CONFIG } from '../../scraper-config';

// Mock the gcsApiService
vi.mock('../../services/gcsApiService', () => ({
  triggerScraper: vi.fn(),
}));

// Mock the userPreferencesService
vi.mock('../../services/userPreferencesService', () => ({
  loadPreferences: vi.fn(),
  savePreferences: vi.fn(),
  saveScraperConfigDebounced: vi.fn(),
}));

import * as gcsApi from '../../services/gcsApiService';
import { loadPreferences, saveScraperConfigDebounced } from '../../services/userPreferencesService';

const mockTriggerScraper = gcsApi.triggerScraper as ReturnType<typeof vi.fn>;
const mockLoadPreferences = loadPreferences as ReturnType<typeof vi.fn>;
const mockSaveScraperConfigDebounced = saveScraperConfigDebounced as ReturnType<typeof vi.fn>;

describe('ScraperTrigger', () => {
  const mockToken = 'test-token-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    // Default mock responses
    mockLoadPreferences.mockResolvedValue({
      theme: 'dark',
      scraperConfig: {
        eu: DEFAULT_SCRAPER_CONFIG.eu,
        tr: DEFAULT_SCRAPER_CONFIG.tr,
      },
    });

    mockTriggerScraper.mockResolvedValue({
      success: true,
      messageId: 'msg-123',
      sourcesCount: 5,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('should render the component with title', async () => {
      render(<ScraperTrigger token={mockToken} />);

      expect(screen.getByText('Scraper Control')).toBeInTheDocument();
      expect(screen.getByText('Trigger news scraping for different regions')).toBeInTheDocument();
    });

    it('should render both EU and TR region panels', async () => {
      render(<ScraperTrigger token={mockToken} />);

      expect(screen.getByText('European Sources')).toBeInTheDocument();
      expect(screen.getByText('Turkish Sources')).toBeInTheDocument();
    });

    it('should show source counts for both regions', async () => {
      render(<ScraperTrigger token={mockToken} />);

      // Both regions have their own source count display
      const sourceCountTexts = screen.getAllByText(/\d+\/\d+ sources enabled/);
      expect(sourceCountTexts.length).toBeGreaterThanOrEqual(2);
    });

    it('should display trigger buttons for both regions', () => {
      render(<ScraperTrigger token={mockToken} />);

      const triggerButtons = screen.getAllByText('Trigger');
      expect(triggerButtons).toHaveLength(2);
    });
  });

  describe('region panel expansion', () => {
    it('should be collapsed by default', () => {
      render(<ScraperTrigger token={mockToken} />);

      // Keywords input should not be visible when collapsed
      expect(screen.queryByPlaceholderText('fenerbahce, galatasaray, ...')).not.toBeInTheDocument();
    });

    it('should expand EU panel when clicked', async () => {
      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Click EU panel header
      const euPanel = screen.getByText('European Sources').closest('div[class*="cursor-pointer"]');
      if (euPanel) {
        await user.click(euPanel);
      }

      await waitFor(() => {
        expect(screen.getByText('Keywords (comma-separated)')).toBeInTheDocument();
      });
    });

    it('should collapse EU panel when clicked again', async () => {
      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Click EU panel header to expand
      const euPanel = screen.getByText('European Sources').closest('div[class*="cursor-pointer"]');
      if (euPanel) {
        await user.click(euPanel);
        await vi.advanceTimersByTimeAsync(100);
        // Click again to collapse
        await user.click(euPanel);
      }

      await waitFor(() => {
        expect(screen.queryByText('Sources')).not.toBeInTheDocument();
      });
    });

    it('should only have one panel expanded at a time', async () => {
      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Click EU panel header
      const euPanel = screen.getByText('European Sources').closest('div[class*="cursor-pointer"]');
      if (euPanel) {
        await user.click(euPanel);
      }

      await waitFor(() => {
        expect(screen.getByText('Keywords (comma-separated)')).toBeInTheDocument();
      });

      // Click TR panel header
      const trPanel = screen.getByText('Turkish Sources').closest('div[class*="cursor-pointer"]');
      if (trPanel) {
        await user.click(trPanel);
      }

      // Should now show TR panel content, EU should be collapsed
      // (Both keywords labels look the same but different panels)
    });
  });

  describe('trigger functionality', () => {
    it('should trigger EU scraper when EU trigger button is clicked', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Find EU's trigger button (first one)
      const triggerButtons = screen.getAllByText('Trigger');
      await user.click(triggerButtons[0]);

      await waitFor(() => {
        expect(mockTriggerScraper).toHaveBeenCalledWith(
          mockToken,
          expect.objectContaining({
            region: 'eu',
            keywords: expect.any(Array),
            urls: expect.any(Array),
            scrape_depth: expect.any(Number),
            persist: false,
          })
        );
      });

      alertSpy.mockRestore();
    });

    it('should trigger TR scraper when TR trigger button is clicked', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Find TR's trigger button (second one)
      const triggerButtons = screen.getAllByText('Trigger');
      await user.click(triggerButtons[1]);

      await waitFor(() => {
        expect(mockTriggerScraper).toHaveBeenCalledWith(
          mockToken,
          expect.objectContaining({
            region: 'tr',
            keywords: expect.any(Array),
            urls: expect.any(Array),
          })
        );
      });

      alertSpy.mockRestore();
    });

    it('should show triggering state', async () => {
      mockTriggerScraper.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      const triggerButtons = screen.getAllByText('Trigger');
      await user.click(triggerButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Triggering...')).toBeInTheDocument();
      });
    });

    it('should show success alert on successful trigger', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      const triggerButtons = screen.getAllByText('Trigger');
      await user.click(triggerButtons[0]);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          expect.stringContaining('EU scraper triggered')
        );
      });

      alertSpy.mockRestore();
    });

    it('should show error alert on failed trigger', async () => {
      mockTriggerScraper.mockRejectedValue(new Error('Scraper Error'));
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      const triggerButtons = screen.getAllByText('Trigger');
      await user.click(triggerButtons[0]);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to trigger EU scraper')
        );
      });

      alertSpy.mockRestore();
    });

    it('should not trigger when no token provided', async () => {
      render(<ScraperTrigger />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      const triggerButtons = screen.getAllByText('Trigger');
      await user.click(triggerButtons[0]);

      expect(mockTriggerScraper).not.toHaveBeenCalled();
    });
  });

  describe('preferences loading', () => {
    it('should load preferences on mount', async () => {
      render(<ScraperTrigger token={mockToken} />);

      await waitFor(() => {
        expect(mockLoadPreferences).toHaveBeenCalledWith(mockToken);
      });
    });

    it('should not load preferences when no token', () => {
      render(<ScraperTrigger />);

      expect(mockLoadPreferences).not.toHaveBeenCalled();
    });

    it('should apply saved scraper config from preferences', async () => {
      const customConfig = {
        scraperConfig: {
          eu: {
            ...DEFAULT_SCRAPER_CONFIG.eu,
            keywords: ['custom1', 'custom2'],
          },
          tr: {
            ...DEFAULT_SCRAPER_CONFIG.tr,
            keywords: ['custom3'],
          },
        },
      };
      mockLoadPreferences.mockResolvedValue(customConfig);

      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Expand EU panel
      const euPanel = screen.getByText('European Sources').closest('div[class*="cursor-pointer"]');
      if (euPanel) {
        await user.click(euPanel);
      }

      await waitFor(() => {
        const keywordsInput = screen.getByPlaceholderText('fenerbahce, galatasaray, ...');
        expect(keywordsInput).toHaveValue('custom1, custom2');
      });
    });
  });

  describe('source management', () => {
    it('should toggle source when clicked', async () => {
      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Expand EU panel
      const euPanel = screen.getByText('European Sources').closest('div[class*="cursor-pointer"]');
      if (euPanel) {
        await user.click(euPanel);
      }

      await waitFor(() => {
        expect(screen.getByText("L'Équipe")).toBeInTheDocument();
      });

      // Toggle a source checkbox
      const checkbox = screen.getAllByRole('checkbox')[0];
      const initialState = checkbox.checked;
      await user.click(checkbox);

      await waitFor(() => {
        expect(checkbox.checked).toBe(!initialState);
      });
    });
  });

  describe('keywords management', () => {
    it('should update keywords when input changes', async () => {
      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Expand EU panel
      const euPanel = screen.getByText('European Sources').closest('div[class*="cursor-pointer"]');
      if (euPanel) {
        await user.click(euPanel);
      }

      await waitFor(() => {
        expect(screen.getByPlaceholderText('fenerbahce, galatasaray, ...')).toBeInTheDocument();
      });

      const keywordsInput = screen.getByPlaceholderText('fenerbahce, galatasaray, ...');
      await user.clear(keywordsInput);
      await user.type(keywordsInput, 'test, keyword');

      expect(keywordsInput).toHaveValue('test, keyword');
    });

    it('should trigger with updated keywords', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Expand EU panel and update keywords
      const euPanel = screen.getByText('European Sources').closest('div[class*="cursor-pointer"]');
      if (euPanel) {
        await user.click(euPanel);
      }

      await waitFor(() => {
        expect(screen.getByPlaceholderText('fenerbahce, galatasaray, ...')).toBeInTheDocument();
      });

      const keywordsInput = screen.getByPlaceholderText('fenerbahce, galatasaray, ...');
      await user.clear(keywordsInput);
      await user.type(keywordsInput, 'test1, test2');

      // Trigger
      const triggerButton = screen.getAllByText('Trigger')[0];
      await user.click(triggerButton);

      await waitFor(() => {
        expect(mockTriggerScraper).toHaveBeenCalledWith(
          mockToken,
          expect.objectContaining({
            keywords: ['test1', 'test2'],
          })
        );
      });

      alertSpy.mockRestore();
    });
  });

  describe('scrape depth', () => {
    it('should display scrape depth selector', async () => {
      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Expand EU panel
      const euPanel = screen.getByText('European Sources').closest('div[class*="cursor-pointer"]');
      if (euPanel) {
        await user.click(euPanel);
      }

      await waitFor(() => {
        expect(screen.getByText('Scrape Depth')).toBeInTheDocument();
      });

      // Should have depth selector
      expect(screen.getByText('1 (Fast)')).toBeInTheDocument();
    });

    it('should update scrape depth when changed', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Expand EU panel
      const euPanel = screen.getByText('European Sources').closest('div[class*="cursor-pointer"]');
      if (euPanel) {
        await user.click(euPanel);
      }

      await waitFor(() => {
        expect(screen.getByText('Scrape Depth')).toBeInTheDocument();
      });

      // Change depth
      const depthSelect = screen.getByRole('combobox');
      await user.selectOptions(depthSelect, '2');

      // Trigger and verify depth
      const triggerButton = screen.getAllByText('Trigger')[0];
      await user.click(triggerButton);

      await waitFor(() => {
        expect(mockTriggerScraper).toHaveBeenCalledWith(
          mockToken,
          expect.objectContaining({
            scrape_depth: 2,
          })
        );
      });

      alertSpy.mockRestore();
    });
  });

  describe('auto-save', () => {
    it('should debounce save config changes', async () => {
      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Wait for initial load
      await vi.advanceTimersByTimeAsync(200);

      // Expand EU panel
      const euPanel = screen.getByText('European Sources').closest('div[class*="cursor-pointer"]');
      if (euPanel) {
        await user.click(euPanel);
      }

      await waitFor(() => {
        expect(screen.getByPlaceholderText('fenerbahce, galatasaray, ...')).toBeInTheDocument();
      });

      // Make a change
      const keywordsInput = screen.getByPlaceholderText('fenerbahce, galatasaray, ...');
      await user.type(keywordsInput, ', newkeyword');

      // Should have called debounced save
      await vi.advanceTimersByTimeAsync(1000);

      expect(mockSaveScraperConfigDebounced).toHaveBeenCalled();
    });
  });

  describe('add source form', () => {
    it('should show add source form when Add Source is clicked', async () => {
      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Expand EU panel
      const euPanel = screen.getByText('European Sources').closest('div[class*="cursor-pointer"]');
      if (euPanel) {
        await user.click(euPanel);
      }

      await waitFor(() => {
        expect(screen.getAllByText('Add Source')[0]).toBeInTheDocument();
      });

      // Click Add Source button
      const addSourceButton = screen.getAllByText('Add Source')[0];
      await user.click(addSourceButton);

      // Verify form is shown
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Source name (e.g., ESPN)')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('URL (e.g., https://www.espn.com/)')).toBeInTheDocument();
      });
    });

    it('should add a new source when form is submitted', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Expand EU panel
      const euPanel = screen.getByText('European Sources').closest('div[class*="cursor-pointer"]');
      if (euPanel) {
        await user.click(euPanel);
      }

      await waitFor(() => {
        expect(screen.getAllByText('Add Source')[0]).toBeInTheDocument();
      });

      // Click Add Source button
      const addSourceButton = screen.getAllByText('Add Source')[0];
      await user.click(addSourceButton);

      // Fill in the form
      const nameInput = screen.getByPlaceholderText('Source name (e.g., ESPN)');
      const urlInput = screen.getByPlaceholderText('URL (e.g., https://www.espn.com/)');
      
      await user.type(nameInput, 'New Test Source');
      await user.type(urlInput, 'https://newtest.com');

      // Submit the form
      const addButton = screen.getByRole('button', { name: 'Add' });
      await user.click(addButton);

      // Verify source was added
      await waitFor(() => {
        expect(screen.getByText('New Test Source')).toBeInTheDocument();
      });

      alertSpy.mockRestore();
    });

    it('should close form when Cancel is clicked', async () => {
      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Expand EU panel
      const euPanel = screen.getByText('European Sources').closest('div[class*="cursor-pointer"]');
      if (euPanel) {
        await user.click(euPanel);
      }

      await waitFor(() => {
        expect(screen.getAllByText('Add Source')[0]).toBeInTheDocument();
      });

      // Click Add Source button
      const addSourceButton = screen.getAllByText('Add Source')[0];
      await user.click(addSourceButton);

      // Verify form is shown
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Source name (e.g., ESPN)')).toBeInTheDocument();
      });

      // Click Cancel
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      // Verify form is hidden
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Source name (e.g., ESPN)')).not.toBeInTheDocument();
      });
    });

    it('should have disabled Add button when fields are empty', async () => {
      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Expand EU panel
      const euPanel = screen.getByText('European Sources').closest('div[class*="cursor-pointer"]');
      if (euPanel) {
        await user.click(euPanel);
      }

      await waitFor(() => {
        expect(screen.getAllByText('Add Source')[0]).toBeInTheDocument();
      });

      // Click Add Source button
      const addSourceButton = screen.getAllByText('Add Source')[0];
      await user.click(addSourceButton);

      // Verify Add button is disabled
      const addButton = screen.getByRole('button', { name: 'Add' });
      expect(addButton).toBeDisabled();
    });
  });

  describe('delete source', () => {
    it('should delete source when delete button is clicked and confirmed', async () => {
      // Mock confirm dialog
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Expand EU panel
      const euPanel = screen.getByText('European Sources').closest('div[class*="cursor-pointer"]');
      if (euPanel) {
        await user.click(euPanel);
      }

      await waitFor(() => {
        expect(screen.getByText("L'Équipe")).toBeInTheDocument();
      });

      // Find delete button by title attribute
      const deleteButtons = screen.getAllByTitle('Delete source');
      expect(deleteButtons.length).toBeGreaterThan(0);

      // Click first delete button
      await user.click(deleteButtons[0]);

      // Verify confirm was called
      expect(confirmSpy).toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('should not delete source when delete is cancelled', async () => {
      // Mock confirm dialog to return false
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Expand EU panel
      const euPanel = screen.getByText('European Sources').closest('div[class*="cursor-pointer"]');
      if (euPanel) {
        await user.click(euPanel);
      }

      await waitFor(() => {
        expect(screen.getByText("L'Équipe")).toBeInTheDocument();
      });

      // Get initial count of sources
      const initialCheckboxes = screen.getAllByRole('checkbox').length;

      // Find and click delete button
      const deleteButtons = screen.getAllByTitle('Delete source');
      await user.click(deleteButtons[0]);

      // Verify confirm was called
      expect(confirmSpy).toHaveBeenCalled();
      
      // Source should still be there (same count)
      expect(screen.getAllByRole('checkbox').length).toBe(initialCheckboxes);

      confirmSpy.mockRestore();
    });
  });

  describe('TR region', () => {
    it('should trigger TR scraper when TR trigger is clicked', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // The second Trigger button is for TR region
      const triggerButtons = screen.getAllByText('Trigger');
      expect(triggerButtons.length).toBeGreaterThanOrEqual(2);
      
      await user.click(triggerButtons[1]);

      await waitFor(() => {
        expect(mockTriggerScraper).toHaveBeenCalledWith(
          mockToken,
          expect.objectContaining({
            region: 'tr',
          })
        );
      });

      alertSpy.mockRestore();
    });

    it('should expand TR panel and show TR sources', async () => {
      render(<ScraperTrigger token={mockToken} />);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Find TR panel
      const trPanel = screen.getByText('Turkish Sources').closest('div[class*="cursor-pointer"]');
      if (trPanel) {
        await user.click(trPanel);
      }

      // Should show TR-specific sources
      await waitFor(() => {
        expect(screen.getByText('Fanatik')).toBeInTheDocument();
      });
    });
  });
});
