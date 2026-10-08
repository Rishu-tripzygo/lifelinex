import { saveDoctorAction, toggleDoctorAction } from "@/app/admin/actions";
import { AdminForm, ConfirmButton } from "@/components/admin/admin-form";
import { Empty, PageHead } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Doctors" };

function DoctorFields({ d }: { d?: { name: string; qualification: string; registrationNumber: string } }) {
  return (
    <>
      <label className="afield">
        <span>Full name</span>
        <input name="name" defaultValue={d?.name} placeholder="Dr. Priya Mehta" required />
      </label>
      <label className="afield">
        <span>Qualification</span>
        <input name="qualification" defaultValue={d?.qualification} placeholder="MBBS, MD (Obstetrics & Gynaecology)" required />
      </label>
      <label className="afield">
        <span>Registration number</span>
        <input name="registrationNumber" defaultValue={d?.registrationNumber} placeholder="NMC / state council number" required />
      </label>
    </>
  );
}

export default async function DoctorsPage() {
  await requireAdmin("ADMIN");
  const doctors = await prisma.doctor.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: { _count: { select: { bookings: { where: { status: "CONFIRMED", startsAt: { gte: new Date() } } } } } },
  });

  return (
    <>
      <PageHead title="Doctors" sub="Patients see the assigned doctor's name, qualification and registration number on their booking page." />
      <section className="apanel">
        <h2>Add a doctor</h2>
        <AdminForm action={saveDoctorAction} submitLabel="Add doctor" className="aform--inline" resetOnSuccess>
          <DoctorFields />
        </AdminForm>
      </section>

      {doctors.length === 0 ? (
        <Empty>No doctors yet.</Empty>
      ) : (
        <div className="acards">
          {doctors.map((d) => (
            <section key={d.id} className={`apanel ${d.active ? "" : "is-off"}`}>
              <header className="acard__head">
                <h2>{d.name}</h2>
                <span className="small">{d.active ? `${d._count.bookings} upcoming` : "Inactive"}</span>
              </header>
              <AdminForm action={saveDoctorAction} submitLabel="Save" submitVariant="ghost">
                <input type="hidden" name="id" value={d.id} />
                <DoctorFields d={d} />
              </AdminForm>
              <ConfirmButton
                action={toggleDoctorAction}
                name="id"
                value={d.id}
                label={d.active ? "Deactivate" : "Reactivate"}
                confirm={d.active ? `Hide ${d.name} from new assignments? Existing bookings keep them.` : `Make ${d.name} available again?`}
              />
            </section>
          ))}
        </div>
      )}
    </>
  );
}
