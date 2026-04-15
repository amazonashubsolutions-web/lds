-- Script para insertar notificaciones de reservas canceladas en el dia de hoy.
-- Puedes ejecutarlo directamente en el SQL Editor de Supabase.

DO $$
DECLARE
    -- Si deseas forzar que aparezcan en el panel de algun usuario particular
    -- (por ejemplo, Maira), pon aqui el ID del usuario. Si es NULL, tomara
    -- el propietario real de la reserva (created_by_user_id).
    target_force_user_id uuid := NULL;
    cancel_count integer := 0;
BEGIN
    -- Intentamos buscar a Maira para pruebas manuales (opcional).
    SELECT id
      INTO target_force_user_id
      FROM public.users
     WHERE first_name ILIKE '%maira%'
     LIMIT 1;

    WITH valid_cancellations AS (
        SELECT
            rsh.reservation_id,
            rsh.new_status,
            rsh.reason AS status_reason,
            r.created_by_user_id,
            r.seller_agency_id,
            r.travel_date,
            p.ciudad AS product_city,
            sa.nombre AS seller_agency_name
        FROM public.reservation_status_history rsh
        JOIN public.reservations r ON r.id = rsh.reservation_id
        LEFT JOIN public.products p ON p.id = r.product_id
        LEFT JOIN public.agencies sa ON sa.id = r.seller_agency_id
        WHERE rsh.new_status IN ('cancelled_by_user', 'cancelled_by_expiration')
          AND date(rsh.changed_at) = current_date
    ),
    notification_payload AS (
        SELECT
            vc.reservation_id,
            COALESCE(target_force_user_id, vc.created_by_user_id) AS target_user_id,
            vc.seller_agency_id AS target_agency_id,
            'cancelada' AS type,
            'Reserva cancelada automaticamente' AS title,
            CASE
                WHEN vc.new_status = 'cancelled_by_expiration'
                    THEN 'Tu reserva sobre ' || COALESCE(vc.product_city, 'este destino') || ' expiro.'
                ELSE 'Tu reserva ha sido cancelada.'
            END AS body,
            'high' AS severity,
            COALESCE(vc.seller_agency_name, 'Agencia Asociada') AS agency_name,
            COALESCE(vc.product_city, 'Ciudad') AS city_name,
            to_char(vc.travel_date, 'YYYY-MM-DD') AS travel_date_string,
            COALESCE(vc.status_reason, 'Cancelacion aplicada en fecha de hoy.') AS reason,
            now() AS created_at
        FROM valid_cancellations vc
    ),
    inserted_notifications_cli AS (
        INSERT INTO public.notifications (
            user_id,
            agency_id,
            reservation_id,
            type,
            title,
            body,
            severity,
            agency_name,
            city_name,
            travel_date_string,
            reason,
            created_at
        )
        SELECT
            notification_payload.target_user_id,
            notification_payload.target_agency_id,
            notification_payload.reservation_id,
            notification_payload.type,
            notification_payload.title,
            notification_payload.body,
            notification_payload.severity,
            notification_payload.agency_name,
            notification_payload.city_name,
            notification_payload.travel_date_string,
            notification_payload.reason,
            notification_payload.created_at
        FROM notification_payload
        RETURNING id, reservation_id
    ),
    inserted_user_recipients AS (
        INSERT INTO public.notification_recipients (notification_id, recipient_user_id)
        SELECT
            inserted_notifications_cli.id,
            notification_payload.target_user_id
        FROM inserted_notifications_cli
        JOIN notification_payload USING (reservation_id)
        WHERE notification_payload.target_user_id IS NOT NULL
        RETURNING notification_id
    ),
    inserted_agency_recipients AS (
        INSERT INTO public.notification_recipients (notification_id, recipient_agency_id)
        SELECT
            inserted_notifications_cli.id,
            notification_payload.target_agency_id
        FROM inserted_notifications_cli
        JOIN notification_payload USING (reservation_id)
        WHERE notification_payload.target_agency_id IS NOT NULL
        RETURNING notification_id
    )
    SELECT count(*) INTO cancel_count FROM inserted_notifications_cli;

    RAISE NOTICE 'Se insertaron % notificaciones relacionadas con cancelaciones hoy.', cancel_count;
END $$;
