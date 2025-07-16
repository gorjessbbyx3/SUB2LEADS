import { storage } from "../storage";
import type { Property } from "@shared/schema";

class MapService {
  async geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'HawaiiCRM/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  async getPropertyMap(property: Property): Promise<{
    mapImageUrl?: string;
    streetViewUrl?: string;
    coordinates?: { lat: number; lon: number };
  }> {
    try {
      let coordinates = null;

      // Use existing coordinates or geocode
      if (property.latitude && property.longitude) {
        coordinates = {
          lat: parseFloat(property.latitude),
          lon: parseFloat(property.longitude)
        };
      } else {
        coordinates = await this.geocodeAddress(property.address);

        // Update property with coordinates
        if (coordinates) {
          await storage.updateProperty(property.id, {
            latitude: coordinates.lat.toString(),
            longitude: coordinates.lon.toString()
          });
        }
      }

      if (!coordinates) {
        throw new Error('Unable to get coordinates for property');
      }

      // Generate static map image URL
      const mapImageUrl = await this.generateStaticMapUrl(coordinates.lat, coordinates.lon);

      // Generate street view URL (Google Maps)
      const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${coordinates.lat},${coordinates.lon}`;

      return {
        mapImageUrl,
        streetViewUrl,
        coordinates
      };
    } catch (error) {
      console.error('Map service error:', error);
      return {};
    }
  }

  private async generateStaticMapUrl(lat: number, lon: number, zoom = 17, size = "600x400"): Promise<string> {
    try {
      // Use OpenStreetMap static map service
      const mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=${zoom}&size=${size}&maptype=mapnik&markers=${lat},${lon},red-pushpin`;

      // Test if the URL is accessible
      const response = await fetch(mapUrl, { method: 'HEAD' });
      if (response.ok) {
        return mapUrl;
      }

      // Fallback to alternative service
      return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=${zoom}&size=${size}&maptype=roadmap&markers=color:red%7C${lat},${lon}&key=YOUR_API_KEY`;
    } catch (error) {
      console.error('Static map generation error:', error);
      // Return a placeholder or default map
      return `https://via.placeholder.com/600x400/f0f0f0/666666?text=Map+Unavailable`;
    }
  }

  async downloadMapImage(property: Property): Promise<string | null> {
    try {
      const mapData = await this.getPropertyMap(property);

      if (!mapData.mapImageUrl || !mapData.coordinates) {
        return null;
      }

      // In a real implementation, you might want to download and save the image locally
      // For now, we'll just return the URL

      // Update property with map image URL
      await storage.updateProperty(property.id, {
        mapImageUrl: mapData.mapImageUrl
      });

      return mapData.mapImageUrl;
    } catch (error) {
      console.error('Error downloading map image:', error);
      return null;
    }
  }

  async getNeighborhoodInfo(lat: number, lon: number): Promise<{
    neighborhood?: string;
    city?: string;
    county?: string;
    zipCode?: string;
  }> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'HawaiiCRM/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data && data.address) {
        return {
          neighborhood: data.address.neighbourhood || data.address.suburb,
          city: data.address.city || data.address.town,
          county: data.address.county,
          zipCode: data.address.postcode
        };
      }

      return {};
    } catch (error) {
      console.error('Neighborhood info error:', error);
      return {};
    }
  }

  async calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): Promise<number> {
    // Calculate distance between two coordinates using Haversine formula
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async getPropertiesNearby(property: Property, radiusMiles = 5): Promise<Property[]> {
    try {
      if (!property.latitude || !property.longitude) {
        return [];
      }

      const allProperties = await storage.getProperties({ limit: 1000 });
      const nearby = [];

      const centerLat = parseFloat(property.latitude);
      const centerLon = parseFloat(property.longitude);

      for (const otherProperty of allProperties) {
        if (otherProperty.id === property.id) continue;

        if (otherProperty.latitude && otherProperty.longitude) {
          const distance = await this.calculateDistance(
            centerLat,
            centerLon,
            parseFloat(otherProperty.latitude),
            parseFloat(otherProperty.longitude)
          );

          if (distance <= radiusMiles) {
            nearby.push(otherProperty);
          }
        }
      }

      return nearby.sort((a, b) => {
        const distA = this.calculateDistance(centerLat, centerLon, parseFloat(a.latitude!), parseFloat(a.longitude!));
        const distB = this.calculateDistance(centerLat, centerLon, parseFloat(b.latitude!), parseFloat(b.longitude!));
        return distA - distB;
      });
    } catch (error) {
      console.error('Error finding nearby properties:', error);
      return [];
    }
  }

  async getPropertyMap(property: any) {
    try {
      const coordinates = await this.geocodeAddress(property.address);
      return {
        mapImageUrl: `https://via.placeholder.com/400x300?text=Map+of+${encodeURIComponent(property.address)}`,
        latitude: coordinates.lat,
        longitude: coordinates.lon,
        zoom: 15,
        address: property.address
      };
    } catch (error) {
      console.error('Error getting property map:', error);
      return {
        mapImageUrl: `https://via.placeholder.com/400x300?text=Map+Unavailable`,
        latitude: 21.3099,
        longitude: -157.8581,
        zoom: 15,
        address: property.address
      };
    }
  }
}

export const mapService = new MapService();