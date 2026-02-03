import { useState, useEffect } from 'react';
import { Download, Trash2, RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Registration {
  email: string;
  firstName: string;
  middleName: string;
  surname: string;
  age: string;
  stateOfOrigin: string;
  lga: string;
  photoUrl: string;
  videoUrl: string;
  submittedAt: string;
}

const Admin = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  const loadRegistrations = () => {
    const data = JSON.parse(localStorage.getItem('registrations') || '[]');
    setRegistrations(data);
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  const downloadData = () => {
    const dataStr = JSON.stringify(registrations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `photogenic-registrations-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Registration data downloaded!');
  };

  const downloadCSV = () => {
    if (registrations.length === 0) {
      toast.error('No registrations to download');
      return;
    }

    const headers = ['Email', 'First Name', 'Middle Name', 'Surname', 'Age', 'State', 'LGA', 'Submitted At'];
    const csvContent = [
      headers.join(','),
      ...registrations.map(r => [
        r.email,
        r.firstName,
        r.middleName,
        r.surname,
        r.age,
        r.stateOfOrigin,
        r.lga,
        r.submittedAt,
      ].map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `photogenic-registrations-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded!');
  };

  const clearData = () => {
    if (confirm('Are you sure you want to delete all registration data? This cannot be undone.')) {
      localStorage.removeItem('registrations');
      setRegistrations([]);
      toast.success('All data cleared');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              📋 Registration Admin
            </h1>
            <p className="text-muted-foreground">Photogenic Edition Photo Contest</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={loadRegistrations} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={downloadCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button onClick={downloadData} size="sm">
              <Download className="w-4 h-4 mr-2" />
              JSON
            </Button>
            <Button onClick={clearData} variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5" />
              Total Registrations: {registrations.length}
            </CardTitle>
          </CardHeader>
        </Card>

        {registrations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No registrations yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {registrations.map((reg, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {reg.photoUrl && (
                      <img
                        src={reg.photoUrl}
                        alt={`${reg.firstName}'s photo`}
                        className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {reg.firstName} {reg.middleName !== 'none' && reg.middleName} {reg.surname}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">{reg.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Age:</span> {reg.age}</p>
                    <p><span className="text-muted-foreground">State:</span> {reg.stateOfOrigin}</p>
                    <p><span className="text-muted-foreground">LGA:</span> {reg.lga}</p>
                    <p className="text-xs text-muted-foreground pt-2">
                      Submitted: {new Date(reg.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
