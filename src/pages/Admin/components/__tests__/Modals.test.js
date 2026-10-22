import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectModal from '../ProjectModal';
import CertificateModal from '../CertificateModal';

describe('ProjectModal & CertificateModal Image Handling (Issue #31)', () => {
  describe('ProjectModal', () => {
    const mockProject = {
      id: 10,
      title: 'Neural Fusion',
      description: 'Sensor fusion model',
      link: 'https://example.com/demo',
      image_url: 'https://pub-r2.dev/projects/neural-fusion.jpg',
      visual_type: 'image',
      tier: 'featured',
      sort_order: 1,
      tags: ['PyTorch', 'ROS'],
      is_confidential: false,
      metrics: { latency: '12ms' },
    };

    it('preserves existing image_url and visual_type on submit when no new file is uploaded', () => {
      const handleSave = vi.fn();
      render(
        <ProjectModal
          isOpen={true}
          isEdit={true}
          initialData={mockProject}
          onClose={vi.fn()}
          onSave={handleSave}
          uploading={false}
        />
      );

      const submitBtn = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(submitBtn);

      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 10,
          title: 'Neural Fusion',
          image_url: 'https://pub-r2.dev/projects/neural-fusion.jpg',
          visual_type: 'image',
          file: null,
        })
      );
    });

    it('sets image_url to null when user clicks remove/clear on the image dropzone', () => {
      const handleSave = vi.fn();
      render(
        <ProjectModal
          isOpen={true}
          isEdit={true}
          initialData={mockProject}
          onClose={vi.fn()}
          onSave={handleSave}
          uploading={false}
        />
      );

      // Click remove button on preview
      const removeBtn = screen.getByRole('button', { name: /remove/i });
      fireEvent.click(removeBtn);

      const submitBtn = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(submitBtn);

      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 10,
          title: 'Neural Fusion',
          image_url: null,
          file: null,
        })
      );
    });
  });

  describe('CertificateModal', () => {
    const mockCert = {
      id: 20,
      title: 'AWS Certified ML Specialist',
      issuer: 'Amazon Web Services',
      date: '2024-01-15',
      image_url: 'https://pub-r2.dev/certs/aws-ml.jpg',
      credential_id: 'AWS-123456',
      category: 'Certificate',
      tier: 'featured',
      sort_order: 0,
    };

    it('preserves existing image_url on submit when no new file is uploaded', () => {
      const handleSave = vi.fn();
      render(
        <CertificateModal
          isOpen={true}
          isEdit={true}
          initialData={mockCert}
          onClose={vi.fn()}
          onSave={handleSave}
          uploading={false}
        />
      );

      const submitBtn = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(submitBtn);

      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 20,
          title: 'AWS Certified ML Specialist',
          image_url: 'https://pub-r2.dev/certs/aws-ml.jpg',
          file: null,
        })
      );
    });

    it('sets image_url to null when user clicks remove/clear on the certificate image dropzone', () => {
      const handleSave = vi.fn();
      render(
        <CertificateModal
          isOpen={true}
          isEdit={true}
          initialData={mockCert}
          onClose={vi.fn()}
          onSave={handleSave}
          uploading={false}
        />
      );

      const removeBtn = screen.getByRole('button', { name: /remove/i });
      fireEvent.click(removeBtn);

      const submitBtn = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(submitBtn);

      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 20,
          title: 'AWS Certified ML Specialist',
          image_url: null,
          file: null,
        })
      );
    });
  });
});
