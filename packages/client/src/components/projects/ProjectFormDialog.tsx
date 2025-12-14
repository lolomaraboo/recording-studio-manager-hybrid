import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

/**
 * Project form validation schema
 */
const projectSchema = z.object({
  clientId: z.number({ message: 'Please select a client' }),
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  projectType: z.enum(['album', 'ep', 'single', 'compilation', 'soundtrack', 'other']),
  genre: z.string().max(100).optional(),
  status: z.enum([
    'pre_production',
    'recording',
    'mixing',
    'mastering',
    'completed',
    'on_hold',
    'cancelled',
  ]),
  startDate: z.string().optional(),
  targetEndDate: z.string().optional(),
  budget: z.string().optional(),
  notes: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

/**
 * Project type from API (dates are serialized as strings)
 * All fields optional except essentials to allow flexible typing
 */
interface Project {
  id: number;
  clientId: number;
  name: string;
  projectType: string;
  status: string;
  // Optional fields
  clientName?: string | null;
  clientArtistName?: string | null;
  description?: string | null;
  genre?: string | null;
  startDate?: string | null;
  targetEndDate?: string | null;
  actualEndDate?: string | null;
  budget?: string | null;
  spentAmount?: string | null;
  notes?: string | null;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSuccess?: () => void;
}

const PROJECT_TYPES = [
  { value: 'album', label: 'Album' },
  { value: 'ep', label: 'EP' },
  { value: 'single', label: 'Single' },
  { value: 'compilation', label: 'Compilation' },
  { value: 'soundtrack', label: 'Soundtrack' },
  { value: 'other', label: 'Other' },
];

const PROJECT_STATUSES = [
  { value: 'pre_production', label: 'Pre-Production' },
  { value: 'recording', label: 'Recording' },
  { value: 'mixing', label: 'Mixing' },
  { value: 'mastering', label: 'Mastering' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

const GENRES = [
  'Pop',
  'Rock',
  'Hip Hop',
  'R&B',
  'Electronic',
  'Jazz',
  'Classical',
  'Country',
  'Latin',
  'Metal',
  'Indie',
  'Alternative',
  'Folk',
  'Blues',
  'Soul',
  'Funk',
  'Reggae',
  'Punk',
  'Soundtrack',
  'Other',
];

/**
 * Project create/edit dialog with form
 */
export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  onSuccess,
}: ProjectFormDialogProps) {
  const isEditMode = !!project;
  const utils = trpc.useUtils();

  // Fetch clients for dropdown
  const { data: clients } = trpc.clients.list.useQuery({ limit: 100 });

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      clientId: 0,
      name: '',
      description: '',
      projectType: 'album',
      genre: '',
      status: 'pre_production',
      startDate: '',
      targetEndDate: '',
      budget: '',
      notes: '',
    },
  });

  // Reset form when dialog opens/closes or project changes
  useEffect(() => {
    if (open) {
      if (project) {
        form.reset({
          clientId: project.clientId,
          name: project.name,
          description: project.description || '',
          projectType: project.projectType as ProjectFormValues['projectType'],
          genre: project.genre || '',
          status: project.status as ProjectFormValues['status'],
          startDate: project.startDate
            ? new Date(project.startDate).toISOString().split('T')[0]
            : '',
          targetEndDate: project.targetEndDate
            ? new Date(project.targetEndDate).toISOString().split('T')[0]
            : '',
          budget: project.budget || '',
          notes: project.notes || '',
        });
      } else {
        form.reset({
          clientId: 0,
          name: '',
          description: '',
          projectType: 'album',
          genre: '',
          status: 'pre_production',
          startDate: new Date().toISOString().split('T')[0],
          targetEndDate: '',
          budget: '',
          notes: '',
        });
      }
    }
  }, [open, project, form]);

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      toast.success('Project created successfully');
      utils.projects.list.invalidate();
      utils.projects.stats.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create project');
    },
  });

  const updateMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success('Project updated successfully');
      utils.projects.list.invalidate();
      utils.projects.stats.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update project');
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: ProjectFormValues) {
    const data = {
      clientId: values.clientId,
      name: values.name,
      description: values.description || undefined,
      projectType: values.projectType,
      genre: values.genre || undefined,
      status: values.status,
      startDate: values.startDate || undefined,
      targetEndDate: values.targetEndDate || undefined,
      budget: values.budget || undefined,
      notes: values.notes || undefined,
    };

    if (isEditMode && project) {
      await updateMutation.mutateAsync({ id: project.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Project' : 'New Project'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Client Selection */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <Select
                    value={field.value?.toString() || ''}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.artistName || client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name and Type */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Album Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROJECT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Genre and Status */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre</FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select genre" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENRES.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROJECT_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Budget */}
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="10000.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the project..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Internal notes..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Saving...'
                  : isEditMode
                  ? 'Save Changes'
                  : 'Create Project'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
