import { render, screen } from '@testing-library/react';
import { Weather } from '@/components/weather';
import { act } from 'react-dom/test-utils';

// Mock window resize
const resizeWindow = (width: number) => {
  window.innerWidth = width;
  window.dispatchEvent(new Event('resize'));
};

describe('Weather', () => {
  const mockWeatherData = {
    latitude: 37.763283,
    longitude: -122.41286,
    generationtime_ms: 0.027894973754882812,
    utc_offset_seconds: 0,
    timezone: 'GMT',
    timezone_abbreviation: 'GMT',
    elevation: 18,
    current_units: { time: 'iso8601', interval: 'seconds', temperature_2m: '°C' },
    current: { time: '2024-01-02T12:00', interval: 900, temperature_2m: 29.3 },
    hourly_units: { time: 'iso8601', temperature_2m: '°C' },
    hourly: {
      time: [
        '2024-01-02T12:00',
        '2024-01-02T13:00',
        '2024-01-02T14:00',
        '2024-01-02T15:00',
        '2024-01-02T16:00',
        '2024-01-02T17:00',
        '2024-01-02T18:00',
      ],
      temperature_2m: [29.3, 30.1, 31.2, 32.0, 31.5, 30.8, 29.9],
    },
    daily_units: {
      time: 'iso8601',
      sunrise: 'iso8601',
      sunset: 'iso8601',
    },
    daily: {
      time: ['2024-01-02'],
      sunrise: ['2024-01-02T07:00'],
      sunset: ['2024-01-02T17:00'],
    },
  };

  beforeEach(() => {
    // Reset window width to desktop default
    window.innerWidth = 1024;
    // Clear any previous resize listeners
    window.removeEventListener('resize', () => {});
  });

  it('renders current temperature with correct styling', () => {
    render(<Weather weatherAtLocation={mockWeatherData} />);

    // Current temperature with styling
    const tempElement = screen.getByText('30°C', { selector: '.text-4xl' });
    expect(tempElement).toBeInTheDocument();
  });

  it('renders high/low temperatures correctly', () => {
    render(<Weather weatherAtLocation={mockWeatherData} />);

    // High/Low text (32.0°C is highest, 29.3°C is lowest in first 24 hours)
    const highLowText = screen.getByText('H:32° L:30°');
    expect(highLowText).toHaveClass('text-blue-50');
  });

  it('shows correct number of hourly forecasts based on screen size', () => {
    const { rerender } = render(<Weather weatherAtLocation={mockWeatherData} />);

    // Desktop view (6 hours)
    const hourlyItems = screen.getAllByText(/°C$/, { selector: '.flex.flex-col.items-center div:last-child' });
    expect(hourlyItems).toHaveLength(6); // 6 hourly forecasts

    // Mobile view (5 hours)
    act(() => {
      resizeWindow(375);
    });
    rerender(<Weather weatherAtLocation={mockWeatherData} />);
    
    const mobileHourlyItems = screen.getAllByText(/°C$/, { selector: '.flex.flex-col.items-center div:last-child' });
    expect(mobileHourlyItems).toHaveLength(5); // 5 hourly forecasts
  });

  it('formats times correctly in hourly forecast', () => {
    render(<Weather weatherAtLocation={mockWeatherData} />);

    // Check formatted times are present
    expect(screen.getByText('12PM')).toBeInTheDocument();
    expect(screen.getByText('1PM')).toBeInTheDocument();
    expect(screen.getByText('2PM')).toBeInTheDocument();
    expect(screen.getByText('3PM')).toBeInTheDocument();
  });

  it('handles day/night display correctly', () => {
    const dayData = {
      ...mockWeatherData,
      current: { ...mockWeatherData.current, time: '2024-01-02T12:00' }, // Midday
    };
    
    const nightData = {
      ...mockWeatherData,
      current: { ...mockWeatherData.current, time: '2024-01-02T18:00' }, // After sunset
    };

    // Test day display
    const { rerender, container } = render(<Weather weatherAtLocation={dayData} />);
    const dayContainer = container.querySelector('div.flex.flex-col.gap-4.rounded-2xl');
    expect(dayContainer).toHaveClass('bg-blue-400');

    // Test night display
    rerender(<Weather weatherAtLocation={nightData} />);
    const nightContainer = container.querySelector('div.flex.flex-col.gap-4.rounded-2xl');
    expect(nightContainer).toHaveClass('bg-indigo-900');
  });

  it('handles resize event cleanup correctly', () => {
    const { unmount } = render(<Weather weatherAtLocation={mockWeatherData} />);
    
    // Spy on removeEventListener
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    // Unmount component
    unmount();
    
    // Verify cleanup
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    );
  });
}); 