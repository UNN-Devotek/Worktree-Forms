import { describe, it, expect, beforeEach } from 'vitest';
import { useFormBuilderStore } from './form-builder-store';

/**
 * form-builder-store — unit tests for field CRUD, undo/redo, and selection.
 * Uses Zustand directly (no React needed); the store is tested as a plain
 * JS object via getState() / setState().
 */

function getStore() {
  return useFormBuilderStore.getState();
}

describe('FormBuilderStore', () => {
  beforeEach(() => {
    // Reset to fresh state, then add a section so field tests can run
    getStore().initializeForm();
    getStore().addSection(0);
  });

  // ─── Initialization ────────────────────────────────────────────────────────

  describe('initializeForm', () => {
    it('[P0] creates a default schema with one page', () => {
      // Re-init without the beforeEach section
      getStore().initializeForm();
      const { formSchema } = getStore();
      expect(formSchema).toBeDefined();
      expect(formSchema!.pages).toHaveLength(1);
      // Default has 0 sections; addSection is called separately in beforeEach
      expect(formSchema!.pages[0].sections).toHaveLength(0);
    });

    it('[P0] isDirty starts false directly after initializeForm (before any mutation)', () => {
      getStore().initializeForm();
      expect(getStore().isDirty).toBe(false);
    });

    it('[P1] uses provided schema when given', () => {
      const custom = {
        version: '2.0',
        title: 'Custom Form',
        pages: [{ id: 'p1', title: 'Page 1', sections: [], order: 0 }],
        settings: { renderMode: 'all-in-one' as const },
        theme: { mode: 'auto' as const },
      };
      getStore().initializeForm(custom as never);
      expect(getStore().formSchema!.title).toBe('Custom Form');
    });
  });

  // ─── Field CRUD ────────────────────────────────────────────────────────────

  describe('addField', () => {
    it('[P0] adds a field to the specified section', () => {
      getStore().addField('text', 0, 0);
      const { formSchema } = getStore();
      expect(formSchema!.pages[0].sections[0].fields).toHaveLength(1);
    });

    it('[P0] sets isDirty to true after adding', () => {
      getStore().addField('text', 0, 0);
      expect(getStore().isDirty).toBe(true);
    });

    it('[P0] selects the newly added field', () => {
      getStore().addField('email', 0, 0);
      const { selectedFieldId, formSchema } = getStore();
      const fields = formSchema!.pages[0].sections[0].fields;
      expect(selectedFieldId).toBe(fields[0].id);
    });

    it('[P1] inserts field at correct index position', () => {
      getStore().addField('text', 0, 0);
      getStore().addField('email', 0, 0); // insert at position 0
      const fields = getStore().formSchema!.pages[0].sections[0].fields;
      expect(fields[0].type).toBe('email');
      expect(fields[1].type).toBe('text');
    });
  });

  describe('removeField', () => {
    it('[P0] removes the specified field', () => {
      getStore().addField('text', 0, 0);
      getStore().addField('email', 0, 1);
      getStore().removeField(0, 0);
      const fields = getStore().formSchema!.pages[0].sections[0].fields;
      expect(fields).toHaveLength(1);
      expect(fields[0].type).toBe('email');
    });

    it('[P0] clears selectedFieldId when selected field is removed', () => {
      getStore().addField('text', 0, 0);
      const removedId = getStore().formSchema!.pages[0].sections[0].fields[0].id;
      getStore().selectField(removedId);
      getStore().removeField(0, 0);
      expect(getStore().selectedFieldId).toBeNull();
    });

    it('[P1] preserves selectedFieldId when a different field is removed', () => {
      getStore().addField('text', 0, 0);
      getStore().addField('email', 0, 1);
      const keptId = getStore().formSchema!.pages[0].sections[0].fields[1].id;
      getStore().selectField(keptId);
      getStore().removeField(0, 0); // remove the first field
      expect(getStore().selectedFieldId).toBe(keptId);
    });
  });

  describe('updateField', () => {
    it('[P0] updates the specified field by id', () => {
      getStore().addField('text', 0, 0);
      const field = getStore().formSchema!.pages[0].sections[0].fields[0];
      getStore().updateField(field.id, { label: 'Updated Label', required: true });
      const updated = getStore().formSchema!.pages[0].sections[0].fields[0];
      expect(updated.label).toBe('Updated Label');
      expect(updated.required).toBe(true);
    });

    it('[P1] does not affect other fields when updating one', () => {
      getStore().addField('text', 0, 0);
      getStore().addField('email', 0, 1);
      const fields = getStore().formSchema!.pages[0].sections[0].fields;
      const targetId = fields[1].id;
      getStore().updateField(targetId, { label: 'Email Address' });
      const updatedFields = getStore().formSchema!.pages[0].sections[0].fields;
      expect(updatedFields[0].label).not.toBe('Email Address');
      expect(updatedFields[1].label).toBe('Email Address');
    });
  });

  describe('duplicateField', () => {
    it('[P0] inserts a copy of the field after the original', () => {
      getStore().addField('text', 0, 0);
      const original = getStore().formSchema!.pages[0].sections[0].fields[0];
      getStore().duplicateField(0, 0);
      const fields = getStore().formSchema!.pages[0].sections[0].fields;
      expect(fields).toHaveLength(2);
      expect(fields[1].id).not.toBe(original.id);
      expect(fields[1].type).toBe(original.type);
    });
  });

  // ─── Selection ─────────────────────────────────────────────────────────────

  describe('selectField / getSelectedField', () => {
    it('[P0] selects a field by id', () => {
      getStore().addField('text', 0, 0);
      const id = getStore().formSchema!.pages[0].sections[0].fields[0].id;
      getStore().selectField(id);
      expect(getStore().selectedFieldId).toBe(id);
    });

    it('[P0] getSelectedField returns the matching field', () => {
      getStore().addField('email', 0, 0);
      const id = getStore().formSchema!.pages[0].sections[0].fields[0].id;
      getStore().selectField(id);
      const selected = getStore().getSelectedField();
      expect(selected?.id).toBe(id);
    });

    it('[P0] selectField(null) clears selection', () => {
      getStore().addField('text', 0, 0);
      const id = getStore().formSchema!.pages[0].sections[0].fields[0].id;
      getStore().selectField(id);
      getStore().selectField(null);
      expect(getStore().selectedFieldId).toBeNull();
      expect(getStore().getSelectedField()).toBeNull();
    });
  });

  // ─── Undo / Redo ───────────────────────────────────────────────────────────

  describe('undo / redo', () => {
    it('[P0] canUndo is false on a fresh store (before any action)', () => {
      getStore().initializeForm(); // reset history fully
      expect(getStore().canUndo()).toBe(false);
    });

    it('[P0] canUndo is true after an action', () => {
      getStore().addField('text', 0, 0);
      expect(getStore().canUndo()).toBe(true);
    });

    it('[P0] undo reverts the last field addition', () => {
      getStore().addField('text', 0, 0);
      getStore().undo();
      const fields = getStore().formSchema!.pages[0].sections[0].fields;
      expect(fields).toHaveLength(0);
    });

    it('[P0] redo reapplies an undone action', () => {
      getStore().addField('text', 0, 0);
      getStore().undo();
      expect(getStore().canRedo()).toBe(true);
      getStore().redo();
      expect(getStore().formSchema!.pages[0].sections[0].fields).toHaveLength(1);
    });

    it('[P1] undo does nothing when at oldest state', () => {
      // Should not throw
      getStore().undo();
      expect(getStore().formSchema).toBeDefined();
    });

    it('[P1] branching: redo history is cleared after a new action post-undo', () => {
      getStore().addField('text', 0, 0);
      getStore().addField('email', 0, 1);
      getStore().undo();
      // Branch: add a different field instead of redoing
      getStore().addField('number', 0, 1);
      expect(getStore().canRedo()).toBe(false);
    });

    it('[P1] multiple sequential undos restore earlier states', () => {
      getStore().addField('text', 0, 0);
      getStore().addField('email', 0, 1);
      getStore().addField('number', 0, 2);

      getStore().undo();
      expect(getStore().formSchema!.pages[0].sections[0].fields).toHaveLength(2);

      getStore().undo();
      expect(getStore().formSchema!.pages[0].sections[0].fields).toHaveLength(1);

      getStore().undo();
      expect(getStore().formSchema!.pages[0].sections[0].fields).toHaveLength(0);
    });
  });
});
