// Service pour la gestion des pages wiki utilisant l'API backend
import { logger } from '../utils/logger';
import { getConfigService } from './config-service';
import { WikiPage } from '../types';

interface WikiPagesResponse {
  success: boolean;
  pages: WikiPage[];
  message?: string;
}

interface WikiPageResponse {
  success: boolean;
  page: WikiPage;
  message?: string;
}

interface WikiActionResponse {
  success: boolean;
  message: string;
  page?: WikiPage;
}

class WikiService {
  private configService = getConfigService();

  private getBaseUrl(): string {
    return this.configService.getApiUrl('/wiki');
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('wiki_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async getAllPages(): Promise<WikiPage[]> {
    try {
      logger.debug('Récupération de toutes les pages wiki');

      const response = await fetch(this.getBaseUrl(), {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data: WikiPagesResponse = await response.json();

      if (data.success) {
        logger.debug('Pages wiki récupérées avec succès', { count: data.pages.length });
        return data.pages;
      } else {
        throw new Error(data.message || 'Erreur lors de la récupération des pages');
      }
    } catch (error) {
      logger.error('Erreur lors de la récupération des pages wiki', { error: error instanceof Error ? error.message : 'Unknown error' });
      return [];
    }
  }

  async getPage(pageId: string | number): Promise<WikiPage | null> {
    try {
      logger.debug('Récupération de la page', { pageId });

      const response = await fetch(`${this.getBaseUrl()}/${encodeURIComponent(pageId)}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data: WikiPageResponse = await response.json();

      if (data.success && data.page) {
        logger.debug('Page récupérée avec succès', { pageId });
        return data.page;
      } else {
        throw new Error(data.message || 'Page non trouvée');
      }
    } catch (error) {
      logger.error('Erreur lors de la récupération de la page', { pageId, error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  async createPage(title: string, content: string, isPrivate: boolean = false, icon?: string): Promise<WikiPage | null> {
    try {
      logger.debug('Création d\'une nouvelle page', { title, isPrivate });

      const response = await fetch(this.getBaseUrl(), {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          title,
          content,
          isPrivate,
          icon
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data: WikiActionResponse = await response.json();

      if (data.success && data.page) {
        logger.debug('Page créée avec succès', { pageId: data.page.id, title });
        return data.page;
      } else {
        throw new Error(data.message || 'Erreur lors de la création de la page');
      }
    } catch (error) {
      logger.error('Erreur lors de la création de la page', { title, error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  async updatePage(pageId: string | number, content: string, icon?: string): Promise<boolean> {
    try {
      logger.debug('Mise à jour de la page', { pageId });

      const response = await fetch(`${this.getBaseUrl()}/${encodeURIComponent(pageId)}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          content,
          icon
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data: WikiActionResponse = await response.json();

      if (data.success) {
        logger.debug('Page mise à jour avec succès', { pageId });
        return true;
      } else {
        throw new Error(data.message || 'Erreur lors de la mise à jour de la page');
      }
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de la page', { pageId, error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  async deletePage(pageId: string | number): Promise<boolean> {
    try {
      logger.debug('Suppression de la page', { pageId });

      const response = await fetch(`${this.getBaseUrl()}/${encodeURIComponent(pageId)}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data: WikiActionResponse = await response.json();

      if (data.success) {
        logger.debug('Page supprimée avec succès', { pageId });
        return true;
      } else {
        throw new Error(data.message || 'Erreur lors de la suppression de la page');
      }
    } catch (error) {
      logger.error('Erreur lors de la suppression de la page', { pageId, error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  async renamePage(pageId: string | number, newTitle: string): Promise<WikiPage | null> {
    try {
      logger.debug('Renommage de la page', { pageId, newTitle });

      const response = await fetch(`${this.getBaseUrl()}/${encodeURIComponent(pageId)}/rename`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          title: newTitle
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data: WikiActionResponse = await response.json();

      if (data.success && data.page) {
        logger.debug('Page renommée avec succès', { pageId, newTitle });
        return data.page;
      } else {
        throw new Error(data.message || 'Erreur lors du renommage de la page');
      }
    } catch (error) {
      logger.error('Erreur lors du renommage de la page', { pageId, newTitle, error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }
}

const wikiService = new WikiService();
export default wikiService;
